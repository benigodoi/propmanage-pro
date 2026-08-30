/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Grants portal access to a tenant: creates (or reuses) their Supabase auth
// account and either emails them a Supabase-hosted invite link or hands
// back the link so the caller can share it manually. Only ever called for
// the "grant access" path — a no-access renter never touches this function.
//
// Security boundary: org_id/role are never taken from the request body.
// They're derived from the caller's own profile, verified server-side with
// the service-role key, so an admin can't invite someone into a different
// org or with an elevated role by tampering with the payload.

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface InviteTenantRequest {
  email: string;
  fullName: string;
  phone?: string;
  sendEmail: boolean;
  redirectTo: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const { data: profile, error: profileErr } = await callerClient
    .from('profiles')
    .select('org_id, role')
    .eq('id', userData.user.id)
    .single();

  if (profileErr || !profile || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }

  let body: InviteTenantRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!body.email || !body.fullName || !body.redirectTo) {
    return new Response(JSON.stringify({ error: 'email, fullName and redirectTo are required' }), { status: 400 });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const metadata = {
    org_id: profile.org_id,
    role: 'tenant',
    full_name: body.fullName,
    phone: body.phone ?? null,
  };

  if (body.sendEmail) {
    const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(body.email, {
      data: metadata,
      redirectTo: body.redirectTo,
    });
    if (error || !data.user) {
      return new Response(JSON.stringify({ error: error?.message ?? 'Failed to invite tenant' }), { status: 400 });
    }
    return new Response(JSON.stringify({ userId: data.user.id, actionLink: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'invite',
    email: body.email,
    options: { data: metadata, redirectTo: body.redirectTo },
  });
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Failed to create tenant account' }), { status: 400 });
  }

  return new Response(
    JSON.stringify({ userId: data.user.id, actionLink: data.properties?.action_link ?? null }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
