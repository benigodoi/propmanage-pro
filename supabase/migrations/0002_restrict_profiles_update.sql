-- Fix privilege-escalation gap in "profiles: self update or admin" (0001_init.sql).
-- That policy's `using` clause allows a user to update their own row
-- (id = auth.uid()) but has no `with check`, so Postgres reuses `using`
-- as the check on the new row too — meaning nothing stops a self-update
-- from also changing `role` or `org_id`, which would let any tenant grant
-- themselves admin, or move themselves into another org.
--
-- RLS policies constrain rows, not columns, so the fix is a column-level
-- grant: authenticated users may only ever update the columns a person
-- should be able to change about themselves. `role` and `org_id` changes
-- must go through the existing SECURITY DEFINER paths (create_organization,
-- handle_new_user) instead of a direct table update.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, email) on public.profiles to authenticated;
