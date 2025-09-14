// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVER_URL = process.env.SUPABASE_URL ?? '';
const SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? '';

// Prefer server vars for server builds, otherwise fall back to public
const URL = SERVER_URL || PUBLIC_URL;
const KEY = SERVER_KEY || PUBLIC_KEY;

export let supabase: SupabaseClient | null = null;

try {
  if (URL && KEY) {
    // create client only if we have both values
    supabase = createClient(URL, KEY);
  } else {
    // no-op: leave supabase as null to avoid throwing during build
    // console.info('Supabase client not created — env vars missing at build time.');
  }
} catch (e) {
  // if createClient throws, avoid crash during build; keep supabase null
  // console.error('Supabase client creation error (ignored during build):', e);
  supabase = null;
}

export default supabase;
export { supabase as namedSupabase };
