# PropManage Pro — Project Status

_Last updated: 2026-10-09_

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

## What works today

### Owner / manager (org admin)
- **Dashboard:** units, occupancy, monthly revenue, pending payments, 6-month revenue chart, portfolio table.
- **Properties & units:** create/delete. Per-unit configuration of rent and utility items; editing a unit re-syncs its unpaid payment rows.
- **Tenants:** add a tenant to a unit with or without portal access. Access can be granted later ("Invite to Portal"). The invite is a copyable link by default, with optional email.
- **Payments:** generated per lease from lease start through the current month. A daily job (`roll_payments()`, pg_cron, 00:05 UTC) adds each new month and marks unpaid past months as Overdue. Payment tracker with filters, per-row status (Pending / Overdue / Paid), bulk mark paid/overdue, and invoice view.
- **Service requests:** inbox at `/service-requests` with a status filter and inline status changes (Pending / In Progress / Completed). The sidebar shows a pending-count badge.
- **Notifications (bell):** new requests, overdue payments, payments awaiting, payments received (last 30 days).

### Tenant portal
- **Dashboard:** balance outstanding, lease status, recent payments, lease documents (read-only).
- **Service requests:** submit a request, and see its status in a popup from the Active Requests tile.
- **Notifications:** request progress/completion, rent due, overdue, payment received.

### Platform
- **Auth:** email/password, password reset, client-side idle (30 min) and absolute (24 h) session timeout. Signup is disabled (invite-only).
- **Data isolation:** organisations are isolated by Postgres RLS; tenants only ever see their own lease, unit, payments and requests.
- **Localisation:** EN/RO and EUR/RON display (stored money is always EUR), saved per user.
- **Routing and theme:** client-side routing with deep links and refresh; dark/light theme.

## Not built / stubbed (known gaps)

| Area | State |
|---|---|
| Online rent payments | Not built. The tenant sees "Online payments aren't set up yet". |
| Reports page | Download buttons are placeholders (they show a "simulating" toast). |
| "Send reminder" (Payments) | Placeholder toast; nothing is sent. |
| Header search box | Input exists, but nothing filters on it. |
| Lease documents | Tenants and owners can view them; there is no upload UI. |
| Email delivery | Supabase default mailer only (2 emails/hour, team members only). No custom SMTP. |
| Notifications | Derived client-side and refreshed on page load or tab focus, not realtime. Read state is per-browser (localStorage). |
| In-app manager invites | None. Managers are invited with `scripts/invite-manager.ts`. |
| Tests | Only `src/lib/screenRouting.test.ts`. No component or API tests. |
| Unused deps | `@google/genai` and `express` are left over from the AI Studio template. |

## Suggested next steps (rough priority)

1. **Onboard the beta testers.** Generate their invite links (see `HANDOVER.md`) and collect feedback.
2. **Custom SMTP** (e.g. Resend), so invite and notification emails reach outside addresses. Then raise `auth.rate_limit.email_sent`.
3. **Real reports:** PDF/XLS export for rent roll, overdue balances and maintenance.
4. **Lease document upload** to Supabase Storage.
5. **Header search** wired to properties, units and tenants.
6. **Cleanup:** remove the unused AI Studio deps, and add tests around the API layer and notifications.

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
| 2026-10-09 | — | Payment status controls, daily payment roll-over job (migration 0008) |
