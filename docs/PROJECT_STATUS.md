# PropManage Pro — Project Status

_Last updated: 2026-10-10_

Property management web app for small landlords/managers: properties, units,
tenants, rent + utility payments, and maintenance (service) requests, with a
separate tenant portal. **Phase: invite-only beta**, being prepared for the
first 1–2 outside manager testers.

| | |
|---|---|
| Live app | https://propmanage-pro.vercel.app (auto-deploys from `main`) |
| Backend | Supabase project `propmanage-pro` (ref `yphvhtdldifrckkeyqgw`), Free tier |
| Repo | https://github.com/benigodoi/propmanage-pro |
| CI | GitHub Actions: typecheck (`npm run lint`) + build on every PR/push to `main` |
| Design | "Indigo SaaS" mockup canvas: https://claude.ai/artifact/6Nb3rtvkpfoMyXL5F9WAK6 |

## What works today

### Owner / manager (org admin)
- **Dashboard (Overview tab):**
  - KPI tiles: units, occupancy, monthly revenue, pending payments.
  - 6-month revenue chart; its axis rounds up to a "nice" maximum, and bars are keyboard-focusable with tooltips.
  - **Needs attention:** overdue rent → new service requests → partially paid → current month awaiting payment. Each row opens the invoice or the request inbox, with an "All caught up" state when empty.
  - **Recent payments** table.
  - Financials and Tenants tabs.
- **Properties & units:** create/delete. Per-unit configuration of rent and utility items; editing a unit re-syncs its unpaid payment rows.
- **Tenants:** add a tenant to a unit with or without portal access. Access can be granted later ("Invite to Portal"). The invite is a copyable link by default, with optional email.
- **Payments:**
  - Generated per lease from lease start through the current month.
  - A daily job (`roll_payments()`, pg_cron, 00:05 UTC) adds each new month and marks unpaid past months as Overdue.
  - Payment tracker with filters, per-row status (Pending / Overdue / Paid / Partial), bulk mark paid/overdue, and invoice view.
- **Service requests:** inbox at `/service-requests` with a status filter and inline status changes (Pending / In Progress / Completed). The sidebar shows a pending-count badge.
- **Notifications (bell):** new requests, overdue payments, payments awaiting, payments received (last 30 days).

### Tenant portal
- **Dashboard:** balance outstanding, lease status, recent payments, lease documents (read-only).
- **Service requests:** submit a request, and see its status in a popup from the Active Requests tile.
- **Notifications:** request progress/completion, rent due, overdue, payment received.

### Platform
- **UI:** "Indigo SaaS" design: zinc neutrals, indigo primary, Geist font, light and dark themes.
  - Colours are semantic tokens in `src/index.css`.
  - All owner and tenant screens pass an automated WCAG AA text-contrast audit in both themes (2026-10-10).
- **Responsive:** below 1024px the sidebar becomes a slide-in drawer: modal, focus-trapped, with 44px touch targets. Tested at 390px, with no horizontal overflow on any screen.
- **Auth:** email/password, password reset, client-side idle (30 min) and absolute (24 h) session timeout. Signup is disabled (invite-only).
- **Data isolation:** organisations are isolated by Postgres RLS; tenants only ever see their own lease, unit, payments and requests. Re-verified on the live project on 2026-10-10 (see `HANDOVER.md` → Security model).
- **Localisation:** EN/RO strings and EUR/RON display (stored money is always EUR), saved per user. Month/date labels are intentionally English in both languages for now.
- **Routing:** client-side routing with deep links and refresh.

## Not built / stubbed (known gaps)

| Area | State |
|---|---|
| Rent due dates | Rent is implicitly due on the **1st of the billing month**; a month becomes Overdue once it has passed. There's no configurable due day. _→ planned 2026-10-11._ |
| Reports page | The three report cards are placeholders (they show a "simulating" toast). _→ planned 2026-10-11._ |
| Lease contracts | No contract generation. _→ planned 2026-10-11._ |
| Online rent payments | Not built. The tenant sees "Online payments aren't set up yet". _→ Q2 2027._ |
| "Send reminder" (Payments) | Placeholder toast; nothing is sent. |
| Header search box | Input exists, but nothing filters on it. |
| Lease documents | Tenants and owners can view them; there is no upload UI. |
| Email delivery | Supabase default mailer only (2 emails/hour, team members only). No custom SMTP. |
| Notifications | Derived client-side and refreshed on page load or tab focus, not realtime. Read state is per-browser (localStorage). |
| In-app manager invites | None. Managers are invited with `scripts/invite-manager.ts`. |
| Tests | Only `src/lib/screenRouting.test.ts`. No component or API tests. |

## Roadmap

### Next session (2026-10-11)

**1. Rent payment due dates, configurable per property**

- **Goal:** each property has a rent due day (e.g. the 5th or the 15th), and a payment becomes Overdue only after that date.
- **Proposed model:**
  - `properties.rent_due_day smallint not null default 1 check (rent_due_day between 1 and 28)`. Capping at 28 means every month has the day.
  - `payments.due_date date`, set when the row is created and backfilled for existing rows as `month + (due_day − 1)`.
- **What changes:**
  - **`roll_payments()`:** marks Overdue when `due_date < current_date` and the payment is unpaid, instead of "the month has passed".
  - **`generatePaymentsForLease()`:** sets `due_date`; also check the unit re-sync path.
  - **UI:** a property form field; due date shown on the payments table, invoices, and the tenant dashboard ("Due 5 Nov").
  - **Needs attention / notifications:** "awaiting" items show the due date. A real days-overdue count becomes meaningful and can replace the month-only label.
- **Decide:**
  - Grace period (none / N days)?
  - Per-lease override of the property default?
  - What happens to already-Overdue rows if a property's due day moves later?
- **Ops:** this is a migration, so it's pushed live before the PR merges (`db push --dry-run` first).

**2. Reports page**

- **Goal:** the three placeholder cards become real reports.
  - **Rent roll / revenue summary:** billed vs collected per property and month.
  - **Overdue balances:** per tenant, with months outstanding.
  - **Maintenance:** service requests by status and age.
- **Proposed approach:**
  - Show each report on screen first, with date-range and property filters.
  - Exports: CSV/XLSX (client-side, e.g. SheetJS bundled, so no CSP change) and PDF via a print stylesheet. A PDF library is only needed if print output isn't good enough.
  - Reuses the existing payments / service-request data. Owner only.
- **Decide:** which reports matter most to the beta testers; XLSX vs CSV; whether utilities are split out in the revenue report.

**3. Lease contract from a template**

- **Goal:** generate a filled-in rental contract for a new tenant from the user's existing template.
- **Inputs needed:** the template file (the user has it). Mark its placeholders (e.g. `{{tenant_name}}`, `{{property_address}}`, `{{rent}}`, `{{start_date}}`, `{{due_day}}`).
- **Proposed approach:** fill a DOCX template client-side (e.g. `docxtemplater`) from lease + unit + property + org data, then download it. Later, store the generated file as a lease document; that needs the backlog's Storage upload.
- **Data gaps to settle:**
  - **Landlord legal details:** org legal name, CUI, address, representative.
  - **Tenant ID details:** CNP / ID number, home address.
  - **Contract terms:** deposit, duration.
  - **Due day:** ties into item 1.
- **Decide:** whether the tenant's personal ID data (CNP, ID number) is stored or typed in at generation time only. This is a GDPR question; not storing it is simpler.

### Backlog (unscheduled)

1. **Onboard the beta testers.** Generate their invite links (see `HANDOVER.md`) and collect feedback. Optional: a two-org isolation smoke test with a throwaway manager account before the first outside tester.
2. **Custom SMTP** (e.g. Resend), so invite and notification emails reach outside addresses. Then raise `auth.rate_limit.email_sent`.
3. **Lease document upload** to Supabase Storage (also needed to store generated contracts).
4. **Header search** wired to properties, units and tenants.
5. **"Send reminder"** for overdue rent (needs SMTP).
6. **Localised month/date labels** (currently English in both languages), app-wide.
7. **Tests:** cover the API layer, notifications and the needs-attention ordering.

### Q1 2027

- **Romanian tax declaration** for rental income. The user wrote "D121"; rental income is normally filed on the **Declarația unică (D212)**, so confirm the form before starting. Likely scope: yearly totals per property/tenant from payment records, exported in the format ANAF expects.
- **Utility provider integrations** (internet, water, power, gas, …): pull bills or readings into unit utility charges instead of entering them by hand. Research per provider: API, e-invoice/SPV, or manual import.

### Q2 2027

- **Online rent payments** for tenants (payment provider integration, e.g. Stripe or a Romanian processor), reconciling automatically into the payments table.

## Changelog (high level)

| Date | PR | Change |
|---|---|---|
| 2026-07 | #1–#3 | Supabase schema + RLS, app wired to real data, CI |
| 2026-07-23 | — | Auth hardening, invite-only onboarding |
| 2026-07-24 | — | Tenant add/invite flow, payments generation, delete flows, routing, bug fixes |
| 2026-07/08 | #4 | EN/RO localisation, EUR/RON currency |
| 2026-10-09 | #5 | Invite Edge Function CORS fix, service request views (owner + tenant), preference saving fix (migration 0007), Vercel config, manager invite script |
| 2026-10-09 | #6 | Routing edge-case tests |
| 2026-10-09 | #7 | Notifications panel, `text-xxs` + dark-mode tint fixes, Vercel URL in `config.toml`, these docs |
| 2026-10-09 | #8 | Payment status controls, daily payment roll-over job (migrations 0008–0009) |
| 2026-10-09 | #9 | Security hardening: DB privileges (0010–0011), security headers, dependency cleanup |
| 2026-10-09 | #10 | EUR/RON rate fetch fix (Frankfurter moved), CSP enforced |
| 2026-10-10 | #11 | Responsive app shell: mobile sidebar drawer (focus trap, inert when closed), viewport-safe panels |
| 2026-10-10 | #12 | Removed the redundant "Generate Reports" sidebar button |
| 2026-10-10 | #13 | Semantic colour tokens, verified to change nothing visually (computed-style diff on 7 screens × 2 themes) |
| 2026-10-10 | #14 | Indigo SaaS restyle: palette, Geist, sentence case (EN/RO strings), new sidebar/header, rebuilt revenue chart, a11y fixes |
| 2026-10-10 | #15 | Tenant-view polish: contrast fixes, tabular money columns |
| 2026-10-10 | #16 | Dashboard: Needs attention panel + Recent payments table; `warning` tokens |
