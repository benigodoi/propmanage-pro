-- Security hardening ahead of the public beta. RLS already blocks all of
-- the below in practice; this removes privileges nothing uses, so a future
-- policy mistake can't silently expose data.

-- 1. Logged-out (anon) clients never touch app tables — every screen they
--    can reach (login, invite landing, password reset) only uses Supabase
--    Auth. Drop Supabase's default blanket grants, including for tables
--    created later.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- 2. No client role needs TRUNCATE / REFERENCES / TRIGGER. TRUNCATE in
--    particular isn't subject to RLS at all.
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;

-- 3. SECURITY DEFINER helpers: callable by signed-in users only (RLS
--    policies invoke the helpers as the querying role, so authenticated
--    keeps EXECUTE). Functions get EXECUTE for PUBLIC by default, so it has
--    to be revoked from PUBLIC, not just anon.
revoke execute on function public.create_organization(text) from public, anon;
revoke execute on function public.current_org_id() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.current_org_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_user_role() to authenticated;

-- 4. A tenant could file a service request against any unit_id (the
--    policy only checked org_id/tenant_id). Require one of their own leases
--    on that unit, matching what createServiceRequest() already does.
drop policy "service_requests: tenant creates own" on service_requests;
create policy "service_requests: tenant creates own" on service_requests
  for insert with check (
    org_id = current_org_id()
    and tenant_id = auth.uid()
    and exists (
      select 1 from leases l
      where l.unit_id = service_requests.unit_id
        and l.tenant_id = auth.uid()
        and l.status = 'Active'
    )
  );
