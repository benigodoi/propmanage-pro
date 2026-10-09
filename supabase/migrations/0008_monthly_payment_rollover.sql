-- Monthly payment roll-over. Payment rows used to be generated only once,
-- when a lease was created (generatePaymentsForLease in
-- src/lib/api/payments.ts), so after that:
--   * new months never got a payment row, and
--   * a 'Pending' payment stayed 'Pending' after its month ended.
-- roll_payments() fixes both and runs daily via pg_cron. It's idempotent,
-- so running it more than once a day (or by hand) is harmless.

create extension if not exists pg_cron;

create or replace function public.roll_payments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month date := date_trunc('month', current_date)::date;
begin
  -- 1. Unpaid payments for months that have ended are overdue.
  update payments
  set status = 'Overdue'
  where status = 'Pending'
    and month < current_month;

  -- 2. Create the missing months for every active lease, through the
  --    current month (capped at lease_end). Only months *after* the
  --    lease's latest existing payment are added, so a row an admin
  --    deliberately deleted from the middle isn't resurrected. Amounts use
  --    the unit's current rent + utilities, same as lease creation.
  insert into payments (
    org_id, lease_id, unit_id, tenant_id, month,
    total_due, base_rent, utility_charges, status, breakdown
  )
  select
    l.org_id, l.id, l.unit_id, l.tenant_id, m.month::date,
    u.base_rent + ut.total, u.base_rent, ut.total,
    case when m.month < current_month then 'Overdue' else 'Pending' end,
    case when ut.total > 0 then array['rent', 'utilities'] else array['rent'] end
  from leases l
  join units u on u.id = l.unit_id
  cross join lateral (
    select coalesce(sum(amount), 0) as total from utility_items where unit_id = l.unit_id
  ) ut
  cross join lateral (
    select max(month) as last_month from payments where lease_id = l.id
  ) last_p
  cross join lateral generate_series(
    greatest(
      date_trunc('month', l.lease_start),
      coalesce(last_p.last_month + interval '1 month', date_trunc('month', l.lease_start))
    ),
    least(date_trunc('month', coalesce(l.lease_end, current_date)), current_month),
    interval '1 month'
  ) as m(month)
  where l.status = 'Active';
end;
$$;

-- Internal job only: not callable through the API by any client role.
revoke execute on function public.roll_payments() from public, anon, authenticated;

-- Daily at 00:05 UTC (02:05/03:05 Romania). Re-scheduling under the same
-- name replaces the existing job.
select cron.schedule('roll-payments-daily', '5 0 * * *', 'select public.roll_payments()');

-- Catch up immediately rather than waiting for the first scheduled run.
select public.roll_payments();
