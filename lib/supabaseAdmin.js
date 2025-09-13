// lib/supabaseAdmin.js  (--> server-only, DO NOT import in client code)
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE SERVICE ROLE env vars (SUPABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY)');
}

export const supabaseAdmin = createClient(url, key);
