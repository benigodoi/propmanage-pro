-- Trigger / event-trigger functions are SECURITY DEFINER and were
-- executable by anon/authenticated via PUBLIC (Supabase security advisor
-- lint 0028/0029). They can't actually run outside a trigger context, but
-- no client role needs EXECUTE on them. Postgres only checks EXECUTE on a
-- trigger function when the trigger is created, not when it fires, so the
-- on_auth_user_created trigger and the RLS auto-enable event trigger keep
-- working.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
