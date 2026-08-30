-- Per-user localisation preferences. Money in the app is always stored as
-- EUR (see units/payments); `currency` only controls the display/conversion
-- shown to this particular user, it never changes stored amounts.
alter table profiles
  add column locale text not null default 'en' check (locale in ('en', 'ro')),
  add column currency text not null default 'EUR' check (currency in ('EUR', 'RON'));
