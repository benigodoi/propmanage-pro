-- 0006 added profiles.locale/currency, but 0002 restricts authenticated
-- users to a column-level UPDATE grant (full_name, phone, email) — so every
-- preference save failed with "permission denied", and the app reverted to
-- the stored defaults (en/EUR) on the next profile load.
--
-- Both columns are display-only per-user preferences (stored money is
-- always EUR), so letting a user change them on their own row carries no
-- escalation risk; role/org_id stay ungranted.
grant update (locale, currency) on public.profiles to authenticated;
