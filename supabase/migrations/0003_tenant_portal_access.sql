-- Tenant portal access is now optional: an admin can record a renter and
-- their lease purely for tracking, without creating a Supabase auth
-- account for them. `tenant_id` becomes nullable and the lease itself
-- carries the contact info to fall back on when there's no linked
-- profile. A renter can still be upgraded to a full portal account later
-- by linking `tenant_id` to a newly-created profile on the same lease row.

alter table leases
  alter column tenant_id drop not null,
  add column tenant_name  text,
  add column tenant_email text,
  add column tenant_phone text,
  add constraint leases_tenant_identity_chk
    check (tenant_id is not null or tenant_name is not null);

-- Payments should still be trackable for a no-access renter's lease, so
-- the same tenant_id/profile link is optional here too.
alter table payments
  alter column tenant_id drop not null;
