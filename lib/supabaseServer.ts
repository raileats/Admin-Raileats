// lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client factory and exported client.
 *
 * This file will throw at import time if required env vars are missing,
 * so other modules can safely import `supabaseServer` without TS thinking it
 * might be null.
 *
 * Ensure you set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_ equivalents)
 * in Vercel (or Amplify) environment variables before deploying.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Throw here so imports fail early and you can see a helpful error in build logs.
  throw new Error(
    "Missing Supabase envs. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_ equivalents)."
  );
}

// Create server client (typed as SupabaseClient)
export const supabaseServer: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Optional getter for code that used getSupabaseServer previously
export function getSupabaseServer(): SupabaseClient {
  return supabaseServer;
}
