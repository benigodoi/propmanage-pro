-- PropManage Pro — initial multi-tenant schema
-- Tenancy model: every business-data table carries an `org_id` FK to
-- `organizations`. One `organizations` row = one property management
-- company (landlord account). `profiles` links a Supabase auth user to
-- an org and a role ('admin' | 'tenant'), mirroring the `Persona` type
-- already used in src/types.ts.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Core tenancy tables
-- ─────────────────────────────────────────────────────────────

create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  org_id     uuid not null references organizations (id) on delete cascade,
  role       text not null check (role in ('admin', 'tenant')),
  full_name  text,
  email      text,
  phone      text,
  created_at timestamptz not null default now()
);

create index profiles_org_id_idx on profiles (org_id);

-- ─────────────────────────────────────────────────────────────
-- Domain tables (mirrors src/types.ts)
-- ─────────────────────────────────────────────────────────────

create table properties (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organizations (id) on delete cascade,
  name             text not null,
  address          text not null,
  units_count      int not null default 0,
  occupancy_rate   numeric not null default 0,
  monthly_revenue  numeric not null default 0,
  icon_type        text not null check (icon_type in ('building', 'house', 'apartments')),
  created_at       timestamptz not null default now()
);

create table units (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations (id) on delete cascade,
  property_id   uuid not null references properties (id) on delete cascade,
  unit_number   text not null,
  bedrooms      int not null default 0,
  bathrooms     numeric not null default 0,
  sqft          int not null default 0,
  base_rent     numeric not null default 0,
  created_at    timestamptz not null default now()
);

create table utility_items (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references organizations (id) on delete cascade,
  unit_id uuid not null references units (id) on delete cascade,
  name    text not null,
  amount  numeric not null default 0
);

-- A lease binds a tenant profile to a unit for a period. Splitting this
-- out of `profiles` (unlike the current mock Tenant type, which mixes
-- person + lease fields) lets a tenant have lease history and lets a
-- unit have a clean current/past occupant trail.
create table leases (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  unit_id     uuid not null references units (id) on delete cascade,
  tenant_id   uuid not null references profiles (id) on delete cascade,
  lease_start date not null,
  lease_end   date,
  status      text not null check (status in ('Active', 'Pending', 'Terminated')),
  created_at  timestamptz not null default now()
);

create index leases_unit_id_idx on leases (unit_id);
create index leases_tenant_id_idx on leases (tenant_id);

create table lease_docs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations (id) on delete cascade,
  lease_id      uuid not null references leases (id) on delete cascade,
  name          text not null,
  size          text,
  doc_date      date,
  storage_path  text, -- path in a Supabase Storage bucket, e.g. `${org_id}/${lease_id}/${name}`
  created_at    timestamptz not null default now()
);

create table payments (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organizations (id) on delete cascade,
  lease_id             uuid not null references leases (id) on delete cascade,
  unit_id              uuid not null references units (id) on delete cascade,
  tenant_id            uuid not null references profiles (id) on delete cascade,
  month                date not null,
  total_due            numeric not null default 0,
  base_rent            numeric not null default 0,
  utility_charges      numeric not null default 0,
  status               text not null check (status in ('Paid', 'Overdue', 'Pending', 'Partial')),
  date_paid            date,
  partial_amount_paid  numeric,
  breakdown            text[] not null default '{}',
  created_at           timestamptz not null default now()
);

create index payments_org_id_idx on payments (org_id);
create index payments_tenant_id_idx on payments (tenant_id);

create table statements (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations (id) on delete cascade,
  payment_id     uuid not null references payments (id) on delete cascade,
  statement_no   text not null,
  billing_period text not null,
  date_issued    date not null,
  date_paid      date,
  items          jsonb not null default '[]',
  notes          text,
  created_at     timestamptz not null default now()
);

create table service_requests (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations (id) on delete cascade,
  unit_id      uuid not null references units (id) on delete cascade,
  tenant_id    uuid not null references profiles (id) on delete cascade,
  title        text not null,
  category     text not null,
  status       text not null check (status in ('Pending', 'In Progress', 'Completed')),
  date_created date not null default current_date,
  description  text,
  created_at   timestamptz not null default now()
);

create index service_requests_org_id_idx on service_requests (org_id);
create index service_requests_tenant_id_idx on service_requests (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- Helper functions
--
-- SECURITY DEFINER so they can read `profiles` even though RLS on
-- `profiles` itself would otherwise block the lookup (avoids
-- self-referential recursion in the policies below).
-- ─────────────────────────────────────────────────────────────

create function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from profiles where id = auth.uid();
$$;

create function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_user_role() = 'admin', false);
$$;

-- Bootstraps a brand-new landlord account: creates the organization and
-- the calling user's admin profile in one atomic call. Client calls this
-- via supabase.rpc('create_organization', { org_name }) right after
-- auth.signUp() for a new admin (no org_id exists yet at that point, so
-- a plain insert would fail the RLS policies on `organizations`).
create function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'user already has a profile';
  end if;

  insert into organizations (name) values (org_name) returning id into new_org_id;
  insert into profiles (id, org_id, role, email)
    values (auth.uid(), new_org_id, 'admin', auth.email());

  return new_org_id;
end;
$$;

-- Tenant signup: the client passes org_id/role in auth signUp() metadata
-- (set by an admin invite flow), and this trigger turns that into a
-- profile row automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ? 'org_id' then
    insert into public.profiles (id, org_id, role, full_name, email, phone)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'org_id')::uuid,
      coalesce(new.raw_user_meta_data ->> 'role', 'tenant'),
      new.raw_user_meta_data ->> 'full_name',
      new.email,
      new.raw_user_meta_data ->> 'phone'
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Row-Level Security
-- ─────────────────────────────────────────────────────────────

alter table organizations    enable row level security;
alter table profiles         enable row level security;
alter table properties       enable row level security;
alter table units            enable row level security;
alter table utility_items    enable row level security;
alter table leases           enable row level security;
alter table lease_docs       enable row level security;
alter table payments         enable row level security;
alter table statements       enable row level security;
alter table service_requests enable row level security;

-- organizations: members can read their own org; only admins can rename it.
create policy "org: members can view" on organizations
  for select using (id = current_org_id());

create policy "org: admins can update" on organizations
  for update using (id = current_org_id() and is_admin());

-- profiles: a user always sees their own row; admins see every profile
-- in their org (needed to list tenants). Only admins create/edit other
-- profiles; users may edit their own contact details.
create policy "profiles: self or org admin can view" on profiles
  for select using (id = auth.uid() or (is_admin() and org_id = current_org_id()));

create policy "profiles: admin manages org profiles" on profiles
  for insert with check (is_admin() and org_id = current_org_id());

create policy "profiles: self update or admin" on profiles
  for update using (id = auth.uid() or (is_admin() and org_id = current_org_id()));

create policy "profiles: admin deletes org profiles" on profiles
  for delete using (is_admin() and org_id = current_org_id());

-- properties: org-wide read for any member; writes are admin-only.
create policy "properties: org members can view" on properties
  for select using (org_id = current_org_id());

create policy "properties: admin manages" on properties
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- units: admins see every unit in the org; tenants see only units they
-- currently/previously lease.
create policy "units: admin views all" on units
  for select using (org_id = current_org_id() and is_admin());

create policy "units: tenant views own" on units
  for select using (
    org_id = current_org_id()
    and exists (select 1 from leases l where l.unit_id = units.id and l.tenant_id = auth.uid())
  );

create policy "units: admin manages" on units
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- utility_items: same visibility shape as units.
create policy "utility_items: admin views all" on utility_items
  for select using (org_id = current_org_id() and is_admin());

create policy "utility_items: tenant views own unit" on utility_items
  for select using (
    org_id = current_org_id()
    and exists (select 1 from leases l where l.unit_id = utility_items.unit_id and l.tenant_id = auth.uid())
  );

create policy "utility_items: admin manages" on utility_items
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- leases: admins manage all; tenants read their own lease rows.
create policy "leases: admin views all" on leases
  for select using (org_id = current_org_id() and is_admin());

create policy "leases: tenant views own" on leases
  for select using (org_id = current_org_id() and tenant_id = auth.uid());

create policy "leases: admin manages" on leases
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- lease_docs: mirrors leases visibility.
create policy "lease_docs: admin views all" on lease_docs
  for select using (org_id = current_org_id() and is_admin());

create policy "lease_docs: tenant views own" on lease_docs
  for select using (
    org_id = current_org_id()
    and exists (select 1 from leases l where l.id = lease_docs.lease_id and l.tenant_id = auth.uid())
  );

create policy "lease_docs: admin manages" on lease_docs
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- payments: admins see all org payments; tenants see only their own.
create policy "payments: admin views all" on payments
  for select using (org_id = current_org_id() and is_admin());

create policy "payments: tenant views own" on payments
  for select using (org_id = current_org_id() and tenant_id = auth.uid());

create policy "payments: admin manages" on payments
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- statements: mirrors payments visibility via the parent payment's tenant.
create policy "statements: admin views all" on statements
  for select using (org_id = current_org_id() and is_admin());

create policy "statements: tenant views own" on statements
  for select using (
    org_id = current_org_id()
    and exists (select 1 from payments p where p.id = statements.payment_id and p.tenant_id = auth.uid())
  );

create policy "statements: admin manages" on statements
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());

-- service_requests: admins manage all; tenants can view and file their
-- own (self-service maintenance requests), but not touch others'.
create policy "service_requests: admin views all" on service_requests
  for select using (org_id = current_org_id() and is_admin());

create policy "service_requests: tenant views own" on service_requests
  for select using (org_id = current_org_id() and tenant_id = auth.uid());

create policy "service_requests: tenant creates own" on service_requests
  for insert with check (org_id = current_org_id() and tenant_id = auth.uid());

create policy "service_requests: admin manages" on service_requests
  for all using (org_id = current_org_id() and is_admin())
  with check (org_id = current_org_id() and is_admin());
