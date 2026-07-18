/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import type { Tenant } from '../../types';

// Powers the OwnerDashboard "Tenants" registry tab: one row per active
// lease, denormalized into the existing Tenant shape.
export async function listActiveLeasesAsTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('leases')
    .select(
      `id, lease_start, lease_end, status,
       tenant:profiles ( id, full_name, email, phone ),
       unit:units ( unit_number, properties ( name ) )`,
    )
    .eq('status', 'Active')
    .order('lease_start', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.tenant?.id ?? row.id,
    name: row.tenant?.full_name ?? row.tenant?.email ?? 'Unnamed tenant',
    email: row.tenant?.email ?? '',
    phone: row.tenant?.phone ?? '',
    leaseStart: row.lease_start,
    leaseEnd: row.lease_end ?? '',
    status: row.status as Tenant['status'],
    unitNumber: row.unit?.unit_number ?? '',
    propertyName: row.unit?.properties?.name ?? '',
  } satisfies Tenant));
}
