// lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Safe factory for server-side Supabase client.
 * - Returns a SupabaseClient when valid envs present.
 * - Returns null when SUPABASE_URL or key missing/invalid.
 * - Keeps a global singleton to avoid recreating clients in serverless warm-calls.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

function isValidUrl(u: string) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}

export function getSupabaseServer(): SupabaseClient | null {
  if (!isValidUrl(SUPABASE_URL) || !SUPABASE_KEY) {
    // don't throw here — return null so callers can respond gracefully during build/deploy
    return null;
  }

  // use global to avoid creating many clients in serverless environment
  const g = global as any;
  if (g._supabaseServerClient) return g._supabaseServerClient as SupabaseClient;

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  g._supabaseServerClient = client;
  return client;
}
