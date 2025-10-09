// lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Prefer server-only envs:
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server actions.
 * NEXT_PUBLIC_* are optionally used for public client usage.
 */
const SERVER_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function getSupabaseServer(): SupabaseClient | null {
  if (!SERVER_URL || !SERVER_KEY) return null;
  // createClient is idempotent for serverless calls — it's OK to call per request
  return createClient(SERVER_URL, SERVER_KEY, {
    auth: { persistSession: false },
    // any other server-side options
  });
}

// convenience export for older files that import `supabaseServer`
export const supabaseServer = getSupabaseServer();
