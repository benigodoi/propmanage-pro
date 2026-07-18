/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
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
    tenantName: row.tenant?.full_name ?? row.tenant?.email ?? 'Unknown tenant',
    tenantEmail: row.tenant?.email ?? undefined,
    managerOrgName: row.unit?.properties?.organizations?.name ?? undefined,
    month: formatMonthLabel(row.month),
    totalDue: row.total_due,
    baseRent: row.base_rent,
    utilityCharges: row.utility_charges,
    utilityBreakdown: (row.unit?.utility_items ?? []).map((u: any) => ({ id: u.id, name: u.name, amount: u.amount })),
    status: row.status as Payment['status'],
    datePaid: row.date_paid ? formatDateLabel(row.date_paid) : undefined,
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
