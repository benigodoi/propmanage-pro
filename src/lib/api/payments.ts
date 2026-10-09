/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import type { TablesInsert } from '../database.types';
import type { Payment } from '../../types';

function formatMonthLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export async function listPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `id, month, total_due, base_rent, utility_charges, status, date_paid, partial_amount_paid, breakdown,
       tenant:profiles ( full_name, email ),
       lease:leases ( tenant_name, tenant_email ),
       unit:units (
         unit_number,
         utility_items ( id, name, amount ),
         properties ( name, address, organizations ( name ) )
       )`,
    )
    .order('month', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    propertyName: row.unit?.properties?.name ?? '',
    propertyAddress: row.unit?.properties?.address ?? undefined,
    unitNumber: row.unit?.unit_number ?? '',
    tenantName: row.tenant?.full_name ?? row.lease?.tenant_name ?? row.tenant?.email ?? row.lease?.tenant_email ?? 'Unknown tenant',
    tenantEmail: row.tenant?.email ?? row.lease?.tenant_email ?? undefined,
    managerOrgName: row.unit?.properties?.organizations?.name ?? undefined,
    month: formatMonthLabel(row.month),
    monthIso: row.month,
    totalDue: row.total_due,
    baseRent: row.base_rent,
    utilityCharges: row.utility_charges,
    utilityBreakdown: (row.unit?.utility_items ?? []).map((u: any) => ({ id: u.id, name: u.name, amount: u.amount })),
    status: row.status as Payment['status'],
    datePaid: row.date_paid ? formatDateLabel(row.date_paid) : undefined,
    datePaidIso: row.date_paid ?? undefined,
    partialAmountPaid: row.partial_amount_paid ?? undefined,
    breakdown: row.breakdown as Payment['breakdown'],
  } satisfies Payment));
}

export async function updatePaymentStatus(
  id: string,
  status: Payment['status'],
  datePaidISO?: string,
): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({ status, date_paid: datePaidISO ?? null })
    .eq('id', id);
  if (error) throw error;
}

function toMonthStart(dateISO: string): string {
  return `${dateISO.slice(0, 7)}-01`;
}

function addOneMonth(monthStartISO: string): string {
  const d = new Date(`${monthStartISO}T00:00:00`);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export interface GeneratePaymentsInput {
  leaseId: string;
  orgId: string;
  unitId: string;
  tenantId: string | null;
  leaseStart: string;
  leaseEnd: string | null;
  baseRent: number;
}

// Generates one payment row per month for a lease, from its start month
// through the current month (an open-ended lease is capped at "now" —
// future months need generating some other way, there's no monthly cron
// yet). Past months land as 'Overdue', the current month as 'Pending',
// mirroring what an admin would expect to see un-paid on day one.
export async function generatePaymentsForLease(input: GeneratePaymentsInput): Promise<void> {
  const { data: utilityItems, error: utilErr } = await supabase
    .from('utility_items')
    .select('amount')
    .eq('unit_id', input.unitId);
  if (utilErr) throw utilErr;

  const utilityCharges = (utilityItems ?? []).reduce((sum, u) => sum + u.amount, 0);
  const breakdown: Payment['breakdown'] = utilityCharges > 0 ? ['rent', 'utilities'] : ['rent'];

  const currentMonthStart = toMonthStart(new Date().toISOString());
  const leaseEndMonth = input.leaseEnd ? toMonthStart(input.leaseEnd) : currentMonthStart;
  const cappedEndMonth = leaseEndMonth > currentMonthStart ? currentMonthStart : leaseEndMonth;

  const rows: TablesInsert<'payments'>[] = [];
  let month = toMonthStart(input.leaseStart);
  while (month <= cappedEndMonth) {
    rows.push({
      org_id: input.orgId,
      lease_id: input.leaseId,
      unit_id: input.unitId,
      tenant_id: input.tenantId,
      month,
      total_due: input.baseRent + utilityCharges,
      base_rent: input.baseRent,
      utility_charges: utilityCharges,
      status: month < currentMonthStart ? 'Overdue' : 'Pending',
      breakdown,
    });
    month = addOneMonth(month);
  }

  if (rows.length === 0) return;
  const { error } = await supabase.from('payments').insert(rows);
  if (error) throw error;
}

// Payments snapshot base_rent/utility_charges at generation time, so
// editing a unit's rent or utility items afterward (in UnitConfiguration)
// wouldn't otherwise reach already-generated payments. Recomputes that
// snapshot for the unit's still-unpaid rows — 'Paid'/'Partial' payments
// are historical record and are left untouched.
export async function syncUnpaidPaymentsForUnit(unitId: string, baseRent: number): Promise<void> {
  const { data: utilityItems, error: utilErr } = await supabase
    .from('utility_items')
    .select('amount')
    .eq('unit_id', unitId);
  if (utilErr) throw utilErr;

  const utilityCharges = (utilityItems ?? []).reduce((sum, u) => sum + u.amount, 0);
  const breakdown: Payment['breakdown'] = utilityCharges > 0 ? ['rent', 'utilities'] : ['rent'];

  const { data: unpaid, error: fetchErr } = await supabase
    .from('payments')
    .select('id')
    .eq('unit_id', unitId)
    .in('status', ['Pending', 'Overdue']);
  if (fetchErr) throw fetchErr;
  if (!unpaid || unpaid.length === 0) return;

  const { error: updateErr } = await supabase
    .from('payments')
    .update({ base_rent: baseRent, utility_charges: utilityCharges, total_due: baseRent + utilityCharges, breakdown })
    .in('id', unpaid.map((p) => p.id));
  if (updateErr) throw updateErr;
}
