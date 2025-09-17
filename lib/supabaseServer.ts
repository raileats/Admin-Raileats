// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fail fast with clear message (build will be fine because envs are known at runtime)
if (!url || !anon) {
  // During build this prevents TypeScript error and provides readable runtime error if envs missing.
  throw new Error('Missing SUPABASE envs. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
}

export const supabaseServer = createClient(url, anon);
