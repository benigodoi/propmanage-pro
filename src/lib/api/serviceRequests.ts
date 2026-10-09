/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import { getCurrentOrgId, getCurrentUserId } from './context';
import type { ServiceRequest } from '../../types';

export async function listServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(
      `id, title, category, status, date_created, description,
       tenant:profiles ( full_name, email ),
       unit:units ( unit_number, properties ( name ) )`,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status as ServiceRequest['status'],
    dateCreated: row.date_created,
    description: row.description ?? '',
    tenantName: row.tenant?.full_name ?? row.tenant?.email ?? '',
    unitNumber: row.unit?.unit_number ?? '',
    propertyName: row.unit?.properties?.name ?? '',
  } satisfies ServiceRequest));
}

// Admin-only (RLS: "service_requests: admin manages").
export async function updateServiceRequestStatus(id: string, status: ServiceRequest['status']): Promise<void> {
  const { error } = await supabase.from('service_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

// Only tenants can file requests (RLS requires tenant_id = auth.uid()); the
// unit is resolved from the caller's own active lease.
export async function createServiceRequest(input: {
  title: string;
  category: string;
  description: string;
}): Promise<void> {
  const userId = await getCurrentUserId();
  const orgId = await getCurrentOrgId();

  const { data: lease, error: leaseErr } = await supabase
    .from('leases')
    .select('unit_id')
    .eq('tenant_id', userId)
    .eq('status', 'Active')
    .limit(1)
    .maybeSingle();
  if (leaseErr) throw leaseErr;
  if (!lease) throw new Error('No active lease found for this account.');

  const { error } = await supabase.from('service_requests').insert({
    org_id: orgId,
    unit_id: lease.unit_id,
    tenant_id: userId,
    title: input.title,
    category: input.category,
    status: 'Pending',
    description: input.description,
  });
  if (error) throw error;
}
