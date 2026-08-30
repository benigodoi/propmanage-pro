/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../supabaseClient';
import { getCurrentUserId } from './context';

export type Locale = 'en' | 'ro';
export type CurrencyCode = 'EUR' | 'RON';

export interface MyProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'tenant';
  orgId: string;
  orgName: string;
  locale: Locale;
  currency: CurrencyCode;
}

export async function getMyProfile(): Promise<MyProfile> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, phone, role, org_id, locale, currency, organizations ( name )')
    .eq('id', userId)
    .single();
  if (error || !data) throw error ?? new Error('Profile not found');

  return {
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    role: data.role as MyProfile['role'],
    orgId: data.org_id,
    orgName: (data as any).organizations?.name ?? '',
    locale: (data as any).locale === 'ro' ? 'ro' : 'en',
    currency: (data as any).currency === 'RON' ? 'RON' : 'EUR',
  };
}

export async function updateMyPreferences(input: { locale: Locale; currency: CurrencyCode }): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ locale: input.locale, currency: input.currency })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateMyProfile(input: { fullName: string; phone: string }): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: input.fullName, phone: input.phone })
    .eq('id', userId);
  if (error) throw error;
}

// Supabase requires confirming the new address before auth.users.email
// actually changes; profiles.email is updated immediately so the UI
// reflects the change right away rather than waiting on that confirmation.
export async function updateMyEmail(email: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error: authErr } = await supabase.auth.updateUser({ email });
  if (authErr) throw authErr;

  const { error: profileErr } = await supabase.from('profiles').update({ email }).eq('id', userId);
  if (profileErr) throw profileErr;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
