// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabaseServer = createClient(url, key, {
  // optional: set global headers or fetch options
  auth: { persistSession: false },
  // Note: service-role-key gives full DB privileges; do not expose it to browser
});
