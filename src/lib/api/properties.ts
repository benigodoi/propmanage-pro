/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import { getCurrentOrgId } from './context';
import type { Property } from '../../types';
import { listUnitsWithDetails } from './units';

// occupancyRate/monthlyRevenue are computed live from real units + active
// leases rather than trusted from the stored properties columns, since
// nothing keeps those columns in sync as units/leases change.
export async function listProperties(): Promise<Property[]> {
  const [{ data: rows, error }, units] = await Promise.all([
    supabase.from('properties').select('*').order('created_at', { ascending: false }),
    listUnitsWithDetails(),
  ]);
  if (error) throw error;

  return (rows ?? []).map((row) => {
    const propUnits = units.filter((u) => u.propertyId === row.id);
    const occupied = propUnits.filter((u) => !!u.activeTenant);
    const occupancyRate = propUnits.length > 0 ? Math.round((occupied.length / propUnits.length) * 100) : 0;
    const monthlyRevenue = occupied.reduce((sum, u) => sum + u.baseRent, 0);

    return {
      id: row.id,
      name: row.name,
      address: row.address,
      unitsCount: propUnits.length,
      occupancyRate,
      monthlyRevenue,
      iconType: row.icon_type as Property['iconType'],
    } satisfies Property;
  });
}

export async function createProperty(input: { name: string; address: string; unitsCount: number }): Promise<Property> {
  const orgId = await getCurrentOrgId();
  const { data, error } = await supabase
    .from('properties')
    .insert({
      org_id: orgId,
      name: input.name,
      address: input.address,
      units_count: input.unitsCount,
      icon_type: 'building',
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    unitsCount: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    iconType: data.icon_type as Property['iconType'],
  };
}
