/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {createClient} from '@supabase/supabase-js';
import type {Database} from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env file.',
  );
}

// Auth links (invite, recovery, ...) arrive with `type=<kind>` in the URL
// hash. Supabase's client consumes and clears that hash asynchronously
// once created, and only emits a distinct event (PASSWORD_RECOVERY) for
// the 'recovery' kind — 'invite' otherwise looks like a plain SIGNED_IN.
// Capture it here, before createClient() below has a chance to run its
// own async URL processing, so callers can still tell the two apart.
export const initialAuthLinkType = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type')
  : null;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
