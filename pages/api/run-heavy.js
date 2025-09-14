// pages/api/run-heavy.js
// Server-side API route that queries Supabase using the service role key.
// Make sure you set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for run-heavy API.');
}

// Create a server-side Supabase client using the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export default async function handler(req, res) {
  try {
    // Example heavy query: select many columns, with pagination
    // Adjust the select and filters to your actual table/columns.
    const { data, error, count } = await supabase
      .from('outlets')
      .select('*', { count: 'exact' })
      .range(0, 9999); // change range as needed; be careful with very large ranges

    if (error) {
      console.error('Supabase error in run-heavy:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({ ok: true, rows: data ?? [], count: count ?? 0 });
  } catch (err) {
    console.error('Unexpected error in run-heavy:', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
