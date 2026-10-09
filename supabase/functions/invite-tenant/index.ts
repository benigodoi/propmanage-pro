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

// Called straight from the browser via supabase.functions.invoke, so every
// response (including errors) needs CORS headers, and the preflight OPTIONS
// request must succeed — otherwise the client only sees a generic
// "Failed to send a request to the Edge Function".
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: 'Not authenticated' }, 401);
  }

  const { data: profile, error: profileErr } = await callerClient
    .from('profiles')
    .select('org_id, role')
    .eq('id', userData.user.id)
    .single();

  if (profileErr || !profile || profile.role !== 'admin') {
    return json({ error: 'Admin access required' }, 403);
  }

  let body: InviteTenantRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.email || !body.fullName || !body.redirectTo) {
    return json({ error: 'email, fullName and redirectTo are required' }, 400);
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
      return json({ error: error?.message ?? 'Failed to invite tenant' }, 400);
    }
    return json({ userId: data.user.id, actionLink: null });
  }

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'invite',
    email: body.email,
    options: { data: metadata, redirectTo: body.redirectTo },
  });
  if (error || !data.user) {
    return json({ error: error?.message ?? 'Failed to create tenant account' }, 400);
  }

  return json({ userId: data.user.id, actionLink: data.properties?.action_link ?? null });
});
