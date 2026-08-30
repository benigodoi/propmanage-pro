-- One-time backfill: generate monthly payment rows for existing leases
-- that don't have any yet. Payment generation didn't exist when these
-- leases were created via the in-app tenant flow, so Financials/Payments
-- was empty for them. Mirrors the same month-range/status logic as the
-- client-side generatePaymentsForLease() (src/lib/api/payments.ts):
-- one row per month from lease_start through the lease_end month (capped
-- at the current month for open-ended leases), 'Overdue' for past months,
-- 'Pending' for the current one.
do $$
declare
  lease_rec record;
  utility_total numeric;
  month_date date;
  end_month date;
  current_month date := date_trunc('month', current_date::timestamp)::date;
  breakdown_arr text[];
begin
  for lease_rec in
    select l.id as lease_id, l.org_id, l.unit_id, l.tenant_id, l.lease_start, l.lease_end,
           u.base_rent
    from leases l
    join units u on u.id = l.unit_id
    where not exists (select 1 from payments p where p.lease_id = l.id)
  loop
    select coalesce(sum(amount), 0) into utility_total
    from utility_items where unit_id = lease_rec.unit_id;

    breakdown_arr := case when utility_total > 0 then array['rent', 'utilities'] else array['rent'] end;

    end_month := date_trunc('month', coalesce(lease_rec.lease_end, current_date)::timestamp)::date;
    if end_month > current_month then
      end_month := current_month;
    end if;

    month_date := date_trunc('month', lease_rec.lease_start::timestamp)::date;
    while month_date <= end_month loop
      insert into payments (
        org_id, lease_id, unit_id, tenant_id, month,
        total_due, base_rent, utility_charges, status, breakdown
      ) values (
        lease_rec.org_id, lease_rec.lease_id, lease_rec.unit_id, lease_rec.tenant_id, month_date,
        lease_rec.base_rent + utility_total, lease_rec.base_rent, utility_total,
        case when month_date < current_month then 'Overdue' else 'Pending' end,
        breakdown_arr
      );
      month_date := month_date + interval '1 month';
    end loop;
  end loop;
end $$;
