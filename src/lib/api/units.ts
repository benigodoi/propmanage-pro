/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import { getCurrentOrgId } from './context';
import type { Tenant, Unit, UtilityItem } from '../../types';

export async function listUnitsWithDetails(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select(
      `id, property_id, unit_number, bedrooms, bathrooms, sqft, base_rent,
       properties ( name ),
       utility_items ( id, name, amount ),
       leases (
         id, status, lease_start, lease_end,
         tenant:profiles ( id, full_name, email, phone ),
         lease_docs ( id, name, size, doc_date )
       )`,
    )
    .order('unit_number', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const activeLease = (row.leases ?? []).find((l: any) => l.status === 'Active');

    const activeTenant: Tenant | undefined = activeLease?.tenant
      ? {
          id: activeLease.tenant.id,
          name: activeLease.tenant.full_name ?? activeLease.tenant.email ?? 'Unnamed tenant',
          email: activeLease.tenant.email ?? '',
          phone: activeLease.tenant.phone ?? '',
          leaseStart: activeLease.lease_start,
          leaseEnd: activeLease.lease_end ?? '',
          status: activeLease.status as Tenant['status'],
          unitNumber: row.unit_number,
          propertyName: row.properties?.name ?? '',
        }
      : undefined;

    const utilities: UtilityItem[] = (row.utility_items ?? []).map((u: any) => ({
      id: u.id,
      name: u.name,
      amount: u.amount,
    }));

    return {
      id: row.id,
      propertyId: row.property_id,
      propertyName: row.properties?.name ?? '',
      unitNumber: row.unit_number,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      baseRent: row.base_rent,
      utilities,
      activeTenant,
      leaseDocs: (activeLease?.lease_docs ?? []).map((d: any) => ({
        name: d.name,
        size: d.size ?? '',
        date: d.doc_date ?? '',
      })),
    } satisfies Unit;
  });
}

export async function createUnit(
  propertyId: string,
  input: { unitNumber: string; bedrooms: number; bathrooms: number; sqft: number; baseRent: number },
): Promise<void> {
  const orgId = await getCurrentOrgId();
  const { error } = await supabase.from('units').insert({
    org_id: orgId,
    property_id: propertyId,
    unit_number: input.unitNumber,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    sqft: input.sqft,
    base_rent: input.baseRent,
  });
  if (error) throw error;
}

export async function updateUnit(
  unitId: string,
  input: { baseRent: number; utilities: UtilityItem[] },
): Promise<void> {
  const orgId = await getCurrentOrgId();

  const { error: unitErr } = await supabase
    .from('units')
    .update({ base_rent: input.baseRent })
    .eq('id', unitId);
  if (unitErr) throw unitErr;

  const { data: existingRows, error: fetchErr } = await supabase
    .from('utility_items')
    .select('id')
    .eq('unit_id', unitId);
  if (fetchErr) throw fetchErr;

  const existingIds = new Set((existingRows ?? []).map((r) => r.id));
  const toDelete = [...existingIds].filter((id) => !input.utilities.some((u) => u.id === id));
  const toUpdate = input.utilities.filter((u) => existingIds.has(u.id));
  const toInsert = input.utilities.filter((u) => !existingIds.has(u.id));

  const results = await Promise.all([
    toDelete.length > 0
      ? supabase.from('utility_items').delete().in('id', toDelete)
      : Promise.resolve({ error: null }),
    ...toUpdate.map((u) =>
      supabase.from('utility_items').update({ name: u.name, amount: u.amount }).eq('id', u.id),
    ),
    toInsert.length > 0
      ? supabase
          .from('utility_items')
          .insert(toInsert.map((u) => ({ org_id: orgId, unit_id: unitId, name: u.name, amount: u.amount })))
      : Promise.resolve({ error: null }),
  ]);

  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}
