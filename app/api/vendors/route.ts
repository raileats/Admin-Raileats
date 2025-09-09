// before: import { createClient } from '@supabase/supabase-js'
// DO NOT create client at top-level

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // use db if possible

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key);
}

export async function GET(req: Request) {
  // if you need supabase:
  const supabase = getSupabaseClient();
  if (supabase) {
    // use supabase (server-side) ...
  } else {
    // fallback to using db (lib/db.js) or return a helpful error
  }
}
