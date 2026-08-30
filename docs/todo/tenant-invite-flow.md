# TODO: In-app tenant invite + lease assignment

**Status:** planned, not started. Scoped 2026-07-23, picked up as the natural
next step after the manager invite/onboarding flow. Do this next session.

## Problem

`OwnerDashboard.tsx`'s "Tenants" tab is read-only — it lists existing
`leases` rows (`listActiveLeasesAsTenants` in `lib/api/leases.ts`). There is
no way, in-app, to invite a tenant or link them to a unit. Today a tenant
can only be added via manual Supabase dashboard + SQL Editor steps (same
pattern as manager invites, see memory `invite_onboarding_flow`), which
doesn't scale past the tiny beta.

## Why this needs an Edge Function (not just client code)

`leases.tenant_id` → `profiles.id` → `auth.users.id`. A tenant record can
only exist for someone with a real auth account, and creating that account
(`auth.admin.inviteUserByEmail`) requires the service-role key — it can
never run from client code or a plain Postgres RPC. So "send the invite
email" has to happen server-side, in a Supabase Edge Function.

Everything *after* the auth user exists, though, needs no new database
work — the existing schema already covers it:
- `handle_new_user` (0001_init.sql) already turns `org_id`/`role` in the
  invited user's metadata into a `profiles` row automatically.
- The existing `"leases: admin manages"` RLS policy already lets an admin
  insert a lease row for any tenant within their own org, straight from
  the client with their normal session — no new policy or RPC required.

## Plan

1. **Edge Function** (`supabase/functions/invite-tenant/index.ts`):
   - Takes `{ email, fullName }` only. Do **not** accept `org_id` or
     `role` from the client — derive `org_id` server-side from the
     caller's own verified session/profile (via a service-role query),
     and hardcode `role: 'tenant'`. This is the critical security
     boundary: an admin must never be able to invite someone into a
     *different* org, or invite with an elevated role, by tampering with
     the request body.
   - Verify the caller is authenticated and `is_admin()` before doing
     anything (reject otherwise).
   - Call `supabase.auth.admin.inviteUserByEmail(email, { data: { org_id, role: 'tenant', full_name: fullName }, redirectTo: <site origin> })`.
   - Return the new user's id to the client.
   - Needs `SUPABASE_SERVICE_ROLE_KEY` set as an Edge Function secret
     (`supabase secrets set`) — never in client env vars.

2. **Client API** (`src/lib/api/leases.ts`): add `inviteTenant(input: { email, fullName, unitId, leaseStart, leaseEnd, baseRent })`:
   - Calls the Edge Function via `supabase.functions.invoke('invite-tenant', ...)`.
   - On success, inserts the `leases` row directly via the normal client
     (`supabase.from('leases').insert(...)`), relying on existing RLS —
     no new policy needed.
   - Surface a clear error if the lease insert fails after the invite
     already succeeded (tenant exists but isn't linked yet) — probably
     needs a small "link existing tenant to a unit" fallback path too,
     so an admin isn't stuck manually fixing it in SQL.

3. **UI**: an "Add Tenant" modal, same pattern as the existing
   `showAddPropertyModal`/`showAddUnitModal` in `App.tsx` — unit picker
   (favor vacant units), tenant name/email, lease start/end, base rent
   (default from `unit.baseRent`, editable). Reasonable entry points:
   the Tenants tab in `OwnerDashboard.tsx`, and/or an "Assign Tenant"
   action on a vacant unit in `UnitConfiguration.tsx`.

4. **`AcceptInviteScreen.tsx` needs no changes** — a tenant invited this
   way already has a `profiles` row by the time they click the link, so
   it takes the existing "join existing org" path (name + password only).

## Known gap to check before shipping

`auth.rate_limit.email_sent = 2` (per hour, project-wide) in
`supabase/config.toml` — fine for the current trickle of manager invites,
but will throttle tenant invites fast if adding several tenants at once.
Raise this and/or configure custom SMTP before relying on this for
anything beyond a couple of invites per hour.
