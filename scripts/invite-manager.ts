/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Creates a bare invite for a new beta-tester manager and prints the invite
// link to share with them manually. No email is sent: Supabase's built-in
// mailer only delivers to the project's own team members, so without
// custom SMTP a dashboard "Send invitation" to an outside address fails.
//
// The invite carries no org_id/role metadata on purpose, so handle_new_user
// creates no profile and AcceptInviteScreen takes the "new org" path — the
// tester names their company and becomes admin of their own isolated org.
//
// Usage (service-role key: Supabase dashboard → Settings → API keys, never
// commit it or put it in a VITE_ variable):
//   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/invite-manager.ts <email> <app-url>

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const [email, appUrl] = process.argv.slice(2);
if (!email || !appUrl) {
  console.error('Usage: npx tsx scripts/invite-manager.ts <email> <app-url>');
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

const { data, error } = await supabase.auth.admin.generateLink({
  type: 'invite',
  email,
  options: { redirectTo: appUrl },
});

if (error) {
  console.error(`Failed to invite ${email}: ${error.message}`);
  process.exit(1);
}

console.log(`Invite created for ${email}. Send them this link (single use, expires in 1h):\n`);
console.log(data.properties.action_link);
