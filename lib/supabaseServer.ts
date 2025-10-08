// lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

if (!url || !serviceKey) {
  // Throwing here ensures build fails early if envs missing.
  throw new Error(
    "Missing Supabase envs. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_ equivalents) in your hosting env."
  );
}

// Export a function that returns a fresh supabase client (server-side)
export function getSupabaseServer(): SupabaseClient {
  return createClient(url, serviceKey);
}
