// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Use NEXT_PUBLIC_* keys if you use the client in browser components.
 * If you need server-only usage, put server keys in process.env without NEXT_PUBLIC prefix
 * and create a separate server client where necessary.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Throwing here helps surface missing env vars at build-time.
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
  );
}

// createClient returns a Supabase client instance — export both named and default for compatibility
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
