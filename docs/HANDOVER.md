# Handover — PropManage Pro

Everything needed to pick this project up. For _what_ is built and what's
next, see [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

## Stack

- **Frontend:** React 19 + TypeScript + Vite 6, Tailwind CSS v4 (configured in `src/index.css`, no `tailwind.config`), `react-router-dom`, `lucide-react` icons.
- **Backend:** Supabase. Postgres with RLS, Auth, and one Edge Function (Deno).
- **Hosting:** Vercel (static SPA, `vercel.json` rewrites every path to `index.html`).

## Run locally

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:3000
npm run lint           # tsc --noEmit (what CI runs)
npm test               # node test runner via tsx
npm run build
```

There is **no local Supabase stack**, since Docker isn't available on the dev machine. Local dev talks to the live project, so be careful with data writes.

## Code map

```
src/
  App.tsx                  # top-level state, data fetching, owner/tenant screen router, modals
  main.tsx                 # providers (router, LocalizationProvider)
  types.ts                 # domain types (Unit, Payment, ServiceRequest, OwnerScreen, …)
  index.css                # Tailwind v4 theme: semantic colour tokens (light + `.dark`), Geist font, `shadow-card`, `text-xxs`
  components/              # one file per screen/widget
    OwnerDashboard.tsx, PaymentTracker.tsx, UnitConfiguration.tsx,
    ServiceRequestsInbox.tsx (owner), TenantDashboard.tsx,
    MyServiceRequestsModal.tsx (tenant), Header.tsx (incl. notifications),
    Sidebar.tsx (static ≥1024px, modal drawer below), LoginScreen.tsx,
    AcceptInviteScreen.tsx, …
  contexts/LocalizationContext.tsx   # locale/currency state, t(), formatMoney()
  hooks/                   # useAsyncGuard (double-submit), useSessionTimeout
  lib/
    supabaseClient.ts      # client + captures invite link type before Supabase clears the hash
    api/*.ts               # all DB access, one module per table/area
    i18n/{en,ro}.ts        # dictionaries — ro must have exactly the same keys as en (typechecked)
    notifications.ts       # derives notifications from payments + service requests
    screenRouting.ts       # URL <-> screen mapping (URL is the source of truth)
    currency.ts            # EUR/RON conversion + formatting
supabase/
  migrations/0001…0011     # schema, RLS, grants, payment roll-over job, security hardening — apply with `npx supabase db push`
  functions/invite-tenant/ # Edge Function: grants a tenant portal access
  config.toml              # mirrors live auth config — see the warning below
scripts/invite-manager.ts  # generates manager (beta tester) invite links
docs/                      # this file, PROJECT_STATUS.md
```

## Data model and security (read before touching the DB)

- **Organisations:** each org is fully isolated. Every table has `org_id`, and RLS checks `current_org_id()` and `is_admin()`, which are SECURITY DEFINER helpers in `0001_init.sql`.
- **Roles:** `profiles.role` is `admin` (manager/owner, shown as persona "owner") or `tenant`. Each org has independent admins. There is deliberately **no** super-owner / multi-org tier.
- **Profile updates:** users have a **column-level** UPDATE grant on `profiles`: `full_name, phone, email, locale, currency` (migrations `0002`, `0007`). Any new user-editable profile column needs its own `grant update (...)` migration, or saves will fail with "permission denied". Never grant `role` or `org_id`.
- **Tenants without portal access:** a lease can have `tenant_id = null`, with contact details stored on the lease (`tenant_name/email/phone`). Granting access later links `tenant_id` and relinks payments.
- **Money:** always stored in EUR. Currency only affects display.
- **Rent due date:** today rent is implicitly due on the 1st of the billing month (`payments.month`). There's no due-day column yet; per-property due days are planned (see `PROJECT_STATUS.md` → Roadmap).
- **Payments roll-over:** `public.roll_payments()` runs daily via pg_cron (job `roll-payments-daily`, migration 0008). It flips past-month `Pending` to `Overdue` and adds missing months after each active lease's latest payment, using the unit's *current* rent and utilities. It's idempotent; to run it by hand: `npx supabase db query --linked "select public.roll_payments()"`. API roles can't execute it. Check runs with `select * from cron.job_run_details order by start_time desc limit 5`.

## Security model (audited 2026-10-09, multi-tenancy re-verified live 2026-10-10)

- **What's public:** the repo and the frontend bundle. The bundle holds only `VITE_SUPABASE_URL` and the *publishable* key, which are safe by design. Anything prefixed `VITE_` is shipped to browsers, so never put a secret in one.
- **Secrets:** the service-role key exists only in Supabase (Edge Function secret) and is pasted locally for `scripts/invite-manager.ts`. `.env*` is gitignored. Git history was checked: no secrets were ever committed.
- **Database:**
  - RLS is enabled on every table.
  - `anon` has **no** table privileges (migration 0010), including default privileges for future tables.
  - `authenticated` has no TRUNCATE / REFERENCES / TRIGGER.
  - The SECURITY DEFINER helpers (`current_org_id`, `is_admin`, `current_user_role`, `create_organization`) are executable by `authenticated` only; the RLS policies and onboarding need them, so the advisor warnings about them are expected. `roll_payments` is cron-only. Trigger functions (`handle_new_user`, `rls_auto_enable`) aren't executable by any client role (0011).
- **New tables:** on the live project they get RLS automatically (the `ensure_rls` event trigger → `rls_auto_enable()`). That comes from Supabase's dashboard "automatic RLS" setting, **not** from the migrations, so a fresh project needs it switched on (or `enable row level security` in each migration). Either way you still need to write policies **and** `grant select/insert/update/delete ... to authenticated` explicitly.
- **Auth:** signup is disabled (verified live: `/auth/v1/settings` → `disable_signup: true`). Email is the only provider, and email confirmation is on. This matters: `handle_new_user` copies `org_id`/`role` from signup metadata, so open signup would let anyone join an existing org.
- **Multi-tenancy check (2026-10-10, live):**
  - All 10 public tables have RLS on; every policy is scoped by `current_org_id()` or `auth.uid()`; `anon` can't select any table.
  - Users can only UPDATE their own `full_name/email/phone/locale/currency`, never `role`/`org_id`.
  - No storage buckets exist.
  - Not yet done: an empirical two-org test.
- **Edge Function:** `invite-tenant` verifies the JWT and admin role, and derives `org_id`/`role` server-side. `redirectTo` is checked by Supabase against the redirect allowlist.
- **Headers** (`vercel.json`):
  - Enforced: HSTS (Vercel default), `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy.
  - The CSP is **enforced** (`Content-Security-Policy`). If you add an external host (fonts, images, APIs), add it to the CSP in `vercel.json`, or the browser will block it.
- **Accepted risks (by design):**
  - An admin sees the tenant's invite link, so they could open the tenant's account before the tenant does.
  - Session limits are client-side only (Free tier).
  - There's no CAPTCHA on login; Supabase's built-in auth rate limits apply.

## UI conventions (since the 2026-10-10 redesign)

- **Colours:** use the semantic tokens from `src/index.css`. Never pair a raw palette class with a `dark:` override; retheming should only touch `index.css`.
  - Surfaces: `bg-canvas`, `bg-surface`, `bg-inset`, `bg-muted`.
  - Borders: `border-line`, `border-line-subtle`.
  - Text: `text-ink`, `text-ink-soft`, `text-ink-secondary`, `text-ink-muted`, `text-ink-faint`.
  - Actions: `bg-primary hover:bg-primary-hover text-on-primary`, plus `bg-primary-soft text-primary-ink` for selected states and links.
  - Status: `success`, `danger`, `warning` (each with `-soft`).
  - A new token needs a light value in `@theme` **and** a dark value in `.dark`.
- **Contrast:** text must meet WCAG AA (4.5:1; 3:1 at 24px+).
  - `text-ink-muted` on a `bg-muted` chip is only 4.39:1, so use `text-ink-secondary` there.
  - Raw pale palette classes on light surfaces (e.g. `text-indigo-500`, `text-emerald-500`, `text-red-500`) are for icons only, never text. Use the text tokens instead; their dark-mode values being 400 shades is intended.
- **One colour per property per element.** Don't put two base `text-*` (or `bg-*`) colour classes on one element, statically or via a conditional. The winner depends on generated CSS order, not class order; make the variants mutually exclusive.
- **Status** is never colour alone: badge = icon + label.
- **Typography:** sentence case everywhere, no `uppercase` + wide tracking. Weights stop at `font-semibold`. Money uses `tabular-nums` (not `font-mono`).
- **Layout:** check screens at 390px (phone) and 1280px. Wide tables go in an `overflow-x-auto` box. Touch targets are ≥44px on mobile (`h-11 lg:h-10`).
- **Design source:** the mockup canvas linked in `PROJECT_STATUS.md`.

## Auth and onboarding flows

- **Signup is disabled.** Everyone arrives via an invite link.
- **New manager (beta tester):**
  1. Copy the service-role key from Supabase → Settings → API keys. Never commit it or put it in a `VITE_` variable.
  2. Run:
     ```bash
     SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/invite-manager.ts tester@example.com https://propmanage-pro.vercel.app
     ```
     (PowerShell: `$env:SUPABASE_SERVICE_ROLE_KEY="..."; npx tsx ...`)
  3. Send them the printed link yourself. It's single-use and expires after **1 hour**.
  4. They set a password and name their company, which creates a new org with them as admin.
- **Second manager in an existing org:**
  - **Order matters:** the first manager must accept their invite and name the company before you invite the second. The org doesn't exist until then.
  - **Don't forget `--org`:** without it, the second person gets a separate org of their own, and nothing warns you.
  1. Find the org id: `npx supabase db query --linked "select id, name from organizations"`.
  2. Run the same script with `--org`:
     ```bash
     SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/invite-manager.ts second@example.com https://propmanage-pro.vercel.app --org <org-id>
     ```
     The invite carries `{ org_id, role: 'admin' }`, so `handle_new_user` creates their admin profile up front.
  3. They open the link and set only a name and password. Both admins have identical rights over the org.
  4. Each person needs their own link. A link signs in as the email it was made for.
- **Tenant:**
  1. The manager adds the tenant in-app with "Grant portal access" ticked. This calls the `invite-tenant` Edge Function, which derives `org_id`/`role` server-side and returns a copyable link.
  2. The tenant sets a name and password on `AcceptInviteScreen`.
- **Why links instead of emails:** Supabase's default mailer only delivers to project team members, at 2/hour.

## Deploying

| What | How |
|---|---|
| Frontend | Merge to `main`. Vercel deploys automatically. Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are set in the Vercel project settings. |
| Migrations | `npx supabase db push --dry-run`, check only the expected files are listed, then `npx supabase db push`. |
| Edge Function | `npx supabase functions deploy invite-tenant`. It must keep its CORS/OPTIONS handling, or browser calls fail with "Failed to send a request to the Edge Function". |
| Auth URL settings | Site URL `https://propmanage-pro.vercel.app`; redirect URLs for that origin and `http://localhost:3000`. |

### ⚠️ Gotchas

- **`supabase config push` overwrites the whole auth section** with `config.toml`, not just the field you changed. It has previously turned off email confirmations and MFA. Prefer dashboard changes; if you must push, read the full printed diff.
- **The Email provider on/off toggle is dashboard-only.** There's no `config.toml` key for it; adding `[auth.email] enabled` breaks the CLI.
- **Pro-plan-only settings** fail to push on the Free tier: server-side session timebox/inactivity, and vector storage.
- **Tailwind v4 silently ignores unknown utilities.** For example, `zinc-150` / `slate-850` aren't real shades; one rendered as a black fallback border. `text-xxs` and the colour tokens exist only because they're defined in `src/index.css`.
- **Tinted backgrounds** (badges, icon tiles): add or reuse a `-soft` token in `src/index.css` rather than a `dark:` pair in the component. In the token's dark value, prefer a `color-mix(… <color>-500 10–15%, transparent)` tint over `-950/20`, which looks muddy grey.

## PR workflow

- One branch per change off `main` → PR → request a Copilot review (`gh pr edit <n> --add-reviewer @copilot`; it doesn't always auto-review, and takes ~5 min).
- For each review comment: fix it (or explain why not), reply naming the commit, and resolve the thread. Then wait for CI and merge.
- **CI (`build`) only runs on PRs targeting `main`,** and changing a PR's base doesn't trigger it.
- **Stacked PRs:** retarget the child to `main` *before* merging the parent with `--delete-branch`. Otherwise GitHub closes the child. Then rebase the child onto `main` and push, so CI runs.

## Debugging tips

- **Query the live DB (read-only checks):** `npx supabase db query --linked "select …"`
- **"Nothing happens" or a generic error from the app:** check the browser Network tab first. RLS denials and missing grants show up there clearly.
- **Accounts:**
  - Admin test account: org "PropManage Pro".
  - A test tenant exists on unit "test / 1" (it has portal access, which is useful for checking the tenant view).
  - Two orgs exist on the live project (2026-10-10).
