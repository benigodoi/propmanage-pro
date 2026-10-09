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
  index.css                # Tailwind v4 theme (incl. custom `text-xxs`) + dark variant
  components/              # one file per screen/widget
    OwnerDashboard.tsx, PaymentTracker.tsx, UnitConfiguration.tsx,
    ServiceRequestsInbox.tsx (owner), TenantDashboard.tsx,
    MyServiceRequestsModal.tsx (tenant), Header.tsx (incl. notifications),
    Sidebar.tsx, LoginScreen.tsx, AcceptInviteScreen.tsx, …
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
  migrations/0001…0007     # schema, RLS, grants — apply with `npx supabase db push`
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
- **Tailwind v4 has no `text-xxs` by default.** It's defined in `src/index.css`. If you use other non-standard utilities, define them there, or they silently do nothing.
- **Dark-mode tints:** use `dark:bg-<color>-500/10…15`. The `-950/20` style looks muddy grey on the slate cards.

## Debugging tips

- **Query the live DB (read-only checks):** `npx supabase db query --linked "select …"`
- **"Nothing happens" or a generic error from the app:** check the browser Network tab first. RLS denials and missing grants show up there clearly.
- **Accounts:**
  - Admin test account: org "PropManage Pro".
  - A test tenant exists on unit "test / 1".
