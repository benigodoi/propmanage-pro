-- One-time correction: payments snapshot base_rent/utility_charges at
-- generation time. Several existing rows were generated before their
-- unit's utility items existed (or before a later rent edit), leaving
-- utility_charges stuck at 0 / total_due stale even after the unit was
-- corrected. Recompute base_rent/utility_charges/total_due/breakdown for
-- still-unpaid (Pending/Overdue) payments from each unit's current state.
-- 'Paid'/'Partial' payments are historical record and are left untouched.
do $$
declare
  unit_rec record;
  utility_total numeric;
  breakdown_arr text[];
begin
  for unit_rec in select id, base_rent from units loop
    select coalesce(sum(amount), 0) into utility_total
    from utility_items where unit_id = unit_rec.id;

    breakdown_arr := case when utility_total > 0 then array['rent', 'utilities'] else array['rent'] end;

    update payments
    set base_rent = unit_rec.base_rent,
        utility_charges = utility_total,
        total_due = unit_rec.base_rent + utility_total,
        breakdown = breakdown_arr
    where unit_id = unit_rec.id
      and status in ('Pending', 'Overdue');
  end loop;
end $$;
