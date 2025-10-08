// lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Safe factory for server-side Supabase client.
 * - getSupabaseServer() returns a SupabaseClient or null if envs missing/invalid.
 * - supabaseServer is a compatibility export (may be null) for older imports.
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
  if (!isValidUrl(SUPABASE_URL) || !SUPABASE_KEY) return null;

  const g = global as any;
  if (g._supabaseServerClient) return g._supabaseServerClient as SupabaseClient;

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  g._supabaseServerClient = client;
  return client;
}

/**
 * Compatibility named export.
 * Modules that still `import { supabaseServer }` will receive either the client or null.
 * IMPORTANT: consumers must check for null (or migrate to getSupabaseServer()).
 */
export const supabaseServer = getSupabaseServer();
