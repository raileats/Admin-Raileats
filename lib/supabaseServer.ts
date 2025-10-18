// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase utility for both service-role (admin) and cookie-aware (session) clients
 *
 * Exports:
 * - supabaseServer  → Service role client (bypass RLS)
 * - serviceClient   → Alias (for compatibility with older code)
 * - getServerClient → Cookie-based anon client (for logged-in user session)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "❌ Missing SUPABASE environment variables. Please set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
}

/* 🟢 1. Admin-level client (service role key) */
export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* 🟢 2. Alias for backward compatibility */
export const serviceClient = supabaseServer;

/* 🟢 3. Cookie-based anon client — for reading session cookies */
export function getServerClient() {
  // read cookies using Next.js headers
  const cookieStore = cookies();

  const access_token = cookieStore.get("sb-access-token")?.value;
  const refresh_token = cookieStore.get("sb-refresh-token")?.value;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
      },
    },
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
    },
  });

  // manually restore session if cookie is present
  if (access_token && refresh_token) {
    client.auth.setSession({
      access_token,
      refresh_token,
    });
  }

  return client;
}
