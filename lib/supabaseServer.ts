// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Centralized Supabase helpers for server & cookie-aware clients.
 *
 * Exports:
 * - supabaseServer: server-only client using SERVICE_ROLE_KEY (use for admin DB ops)
 * - serviceClient: alias for supabaseServer
 * - getServerClient(): returns createServerClient(...) which is cookie-aware (use inside request handlers)
 *
 * NOTE: keep service-role client usage only on server-side (do NOT expose in browser).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Missing SUPABASE environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)");
}

// server-only client (service role) — use for admin operations (bypass RLS)
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// alias (some files import 'serviceClient' or 'supabaseServer')
export const serviceClient = supabaseServer;

/**
 * Return a cookie-aware server client (uses auth-helpers)
 * Use inside route handlers that need to sign-in/out or read session from cookies.
 */
export function getServerClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies });
}
