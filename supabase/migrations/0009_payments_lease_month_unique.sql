-- Follow-up to 0008 (code review on PR #8):
--   * Nothing stopped two overlapping roll_payments() runs (cron + a manual
--     call), or a run racing with client-side generatePaymentsForLease(),
--     from both inserting the same lease/month. A unique index makes that
--     impossible, and roll_payments() now skips existing rows instead.
--   * The same index serves roll_payments()'s per-lease max(month) lookup,
--     which previously had no supporting index.
-- No duplicate (lease_id, month) rows existed when this was written.

create unique index if not exists payments_lease_month_key on payments (lease_id, month);

create or replace function public.roll_payments()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month date := date_trunc('month', current_date)::date;
begin
  -- 1. Unpaid payments for months that have ended are overdue. (The app
  --    doesn't offer "Pending" for past months, so this never fights a
  --    manual choice.)
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
  where l.status = 'Active'
  on conflict (lease_id, month) do nothing;
end;
$$;
