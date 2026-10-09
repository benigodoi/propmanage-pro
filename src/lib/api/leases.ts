/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import { getCurrentOrgId } from './context';
import { generatePaymentsForLease } from './payments';
import type { Tenant } from '../../types';

// A lease's tenant contact fields come either from the linked `profiles`
// row (portal access granted) or straight off the lease itself (no-access
// renter). Shared by leases.ts and units.ts so both fall back the same way.
export function tenantContactFieldsFromLeaseRow(row: any): Pick<
  Tenant,
  'id' | 'leaseId' | 'name' | 'email' | 'phone' | 'hasPortalAccess'
> {
  const hasPortalAccess = !!row.tenant;
  return {
    id: row.tenant?.id ?? row.id,
    leaseId: row.id,
    name: row.tenant?.full_name ?? row.tenant_name ?? row.tenant?.email ?? row.tenant_email ?? 'Unnamed tenant',
    email: row.tenant?.email ?? row.tenant_email ?? '',
    phone: row.tenant?.phone ?? row.tenant_phone ?? '',
    hasPortalAccess,
  };
}

// Powers the OwnerDashboard "Tenants" registry tab: one row per active
// lease, denormalized into the existing Tenant shape.
export async function listActiveLeasesAsTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('leases')
    .select(
      `id, lease_start, lease_end, status, tenant_name, tenant_email, tenant_phone,
       tenant:profiles ( id, full_name, email, phone ),
       unit:units ( unit_number, properties ( name ) )`,
    )
    .eq('status', 'Active')
    .order('lease_start', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...tenantContactFieldsFromLeaseRow(row),
    leaseStart: row.lease_start,
    leaseEnd: row.lease_end ?? '',
    status: row.status as Tenant['status'],
    unitNumber: row.unit?.unit_number ?? '',
    propertyName: row.unit?.properties?.name ?? '',
  } satisfies Tenant));
}

async function inviteTenantAccount(input: {
  email: string;
  fullName: string;
  phone?: string;
  sendEmail: boolean;
}): Promise<{ userId: string; actionLink: string | null }> {
  const { data, error } = await supabase.functions.invoke('invite-tenant', {
    body: {
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      sendEmail: input.sendEmail,
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    // On a non-2xx response the function's own { error } message is only
    // available on the raw Response — surface it instead of the SDK's
    // generic "Edge Function returned a non-2xx status code".
    const message = await error.context?.json?.().then((b: any) => b?.error).catch(() => null);
    throw message ? new Error(message) : error;
  }
  if (data?.error) throw new Error(data.error);
  return { userId: data.userId, actionLink: data.actionLink ?? null };
}

export interface AddTenantInput {
  unitId: string;
  fullName: string;
  email?: string;
  phone?: string;
  leaseStart: string;
  leaseEnd?: string;
  baseRent: number;
  /** Off by default — a renter can be added purely for tracking, with no login. */
  grantAccess: boolean;
  /** Only relevant when grantAccess is true. Off by default: return a copyable link instead of emailing it. */
  sendEmail: boolean;
}

export interface GrantAccessResult {
  /** Set when access was granted without sending an email — copy/share this manually. */
  actionLink: string | null;
}

// Adds a tenant + their lease in one step. Without `grantAccess`, this is a
// plain client insert relying on the existing "leases: admin manages" RLS
// policy — no auth account is ever created. With `grantAccess`, the tenant's
// auth account is created first (via the invite-tenant Edge Function, which
// derives org_id/role server-side), then the lease is linked to it.
export async function addTenant(input: AddTenantInput): Promise<GrantAccessResult> {
  const orgId = await getCurrentOrgId();

  const { error: rentErr } = await supabase
    .from('units')
    .update({ base_rent: input.baseRent })
    .eq('id', input.unitId);
  if (rentErr) throw rentErr;

  if (!input.grantAccess) {
    const { data: lease, error } = await supabase
      .from('leases')
      .insert({
        org_id: orgId,
        unit_id: input.unitId,
        lease_start: input.leaseStart,
        lease_end: input.leaseEnd ?? null,
        status: 'Active',
        tenant_id: null,
        tenant_name: input.fullName,
        tenant_email: input.email ?? null,
        tenant_phone: input.phone ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;

    await generatePaymentsForLease({
      leaseId: lease.id,
      orgId,
      unitId: input.unitId,
      tenantId: null,
      leaseStart: input.leaseStart,
      leaseEnd: input.leaseEnd ?? null,
      baseRent: input.baseRent,
    });

    return { actionLink: null };
  }

  if (!input.email) {
    throw new Error('An email address is required to grant portal access.');
  }

  const { userId, actionLink } = await inviteTenantAccount({
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    sendEmail: input.sendEmail,
  });

  const { data: lease, error: leaseErr } = await supabase
    .from('leases')
    .insert({
      org_id: orgId,
      unit_id: input.unitId,
      lease_start: input.leaseStart,
      lease_end: input.leaseEnd ?? null,
      status: 'Active',
      tenant_id: userId,
    })
    .select('id')
    .single();
  if (leaseErr) {
    throw new Error(
      `The tenant's account was created, but linking their lease failed (${leaseErr.message}). ` +
        'Their account already exists — retry linking them to a unit instead of adding them again.',
    );
  }

  await generatePaymentsForLease({
    leaseId: lease.id,
    orgId,
    unitId: input.unitId,
    tenantId: userId,
    leaseStart: input.leaseStart,
    leaseEnd: input.leaseEnd ?? null,
    baseRent: input.baseRent,
  });

  return { actionLink };
}

// Removes a tenant by deleting their lease row outright — no confirmation
// email, no soft-delete. If the tenant has portal access, their auth
// account/profile is left untouched (only the lease link is removed).
export async function deleteTenant(leaseId: string): Promise<void> {
  const { error } = await supabase.from('leases').delete().eq('id', leaseId);
  if (error) throw error;
}

// Upgrades an existing no-access tenant (added via addTenant with
// grantAccess: false) to a full portal account, reusing the same lease row.
export async function inviteTenantToPortal(leaseId: string, sendEmail: boolean): Promise<GrantAccessResult> {
  const { data: lease, error: fetchErr } = await supabase
    .from('leases')
    .select('tenant_id, tenant_name, tenant_email, tenant_phone')
    .eq('id', leaseId)
    .single();
  if (fetchErr) throw fetchErr;
  if (lease.tenant_id) {
    throw new Error('This tenant already has portal access.');
  }
  if (!lease.tenant_email) {
    throw new Error('This tenant has no email on file — add one before granting portal access.');
  }

  const { userId, actionLink } = await inviteTenantAccount({
    email: lease.tenant_email,
    fullName: lease.tenant_name ?? lease.tenant_email,
    phone: lease.tenant_phone ?? undefined,
    sendEmail,
  });

  const { error: updateErr } = await supabase.from('leases').update({ tenant_id: userId }).eq('id', leaseId);
  if (updateErr) throw updateErr;

  // Existing payment rows for this lease were generated with tenant_id
  // null (no account existed yet) — relink them so they show the tenant's
  // name instead of "Unknown tenant" now that an account exists.
  const { error: paymentsErr } = await supabase.from('payments').update({ tenant_id: userId }).eq('lease_id', leaseId);
  if (paymentsErr) throw paymentsErr;

  return { actionLink };
}
