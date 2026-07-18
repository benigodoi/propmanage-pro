/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';

export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Not authenticated');
  }
  return data.user.id;
}

export async function getCurrentOrgId(): Promise<string> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .single();
  if (error || !data) {
    throw error ?? new Error('Failed to resolve organization for current user');
  }
  return data.org_id;
}
