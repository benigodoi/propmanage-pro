/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Creates an invite for a manager (beta tester) and prints the invite link
// to share with them manually. No email is sent: Supabase's built-in
// mailer only delivers to the project's own team members, so without
// custom SMTP a dashboard "Send invitation" to an outside address fails.
//
// Without --org, the invite carries no org_id/role metadata on purpose, so
// handle_new_user creates no profile and AcceptInviteScreen takes the
// "new org" path — the tester names their company and becomes admin of
// their own isolated org.
//
// With --org <org-id>, the invite carries { org_id, role: 'admin' }, so
// handle_new_user creates an admin profile in that existing org and
// AcceptInviteScreen only asks for a name and password. Use this to add a
// second manager to an org that already exists.
//
// Usage (service-role key: Supabase dashboard → Settings → API keys, never
// commit it or put it in a VITE_ variable):
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/invite-manager.ts <email> <app-url> [--org <org-id>]

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const usage = 'Usage: npx tsx scripts/invite-manager.ts <email> <app-url> [--org <org-id>]';

const args = process.argv.slice(2);
let orgId: string | undefined;
const orgFlag = args.indexOf('--org');
if (orgFlag !== -1) {
  orgId = args[orgFlag + 1];
  if (!orgId || orgId.startsWith('--')) {
    console.error(usage);
    process.exit(1);
  }
  args.splice(orgFlag, 2);
}

const [email, appUrl] = args;
if (!email || !appUrl || args.length > 2) {
  console.error(usage);
  process.exit(1);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('VITE_SUPABASE_URL (from .env) and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Check the org exists before creating the auth user: generateLink creates
// the user immediately, and a bad org_id would make handle_new_user fail
// the insert (or, for a malformed id, the uuid cast).
let orgName: string | undefined;
if (orgId) {
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .maybeSingle();
  if (orgError || !org) {
    console.error(`No organization found with id ${orgId}${orgError ? `: ${orgError.message}` : ''}`);
    process.exit(1);
  }
  orgName = org.name;
}

const { data, error } = await supabase.auth.admin.generateLink({
  type: 'invite',
  email,
  options: {
    redirectTo: appUrl,
    ...(orgId && { data: { org_id: orgId, role: 'admin' } }),
  },
});

if (error) {
  console.error(`Failed to invite ${email}: ${error.message}`);
  process.exit(1);
}

const joining = orgName ? ` as admin of "${orgName}"` : '';
console.log(`Invite created for ${email}${joining}. Send them this link (single use, expires in 1h):\n`);
console.log(data.properties.action_link);
