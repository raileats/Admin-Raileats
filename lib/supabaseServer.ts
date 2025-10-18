// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase utilities
 * - serviceClient: Admin (Service Role Key)
 * - getServerClient(): Cookie-based session client (for server routes)
 * - createAnonClient(): Public client for auth sign-in/out etc.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "❌ Missing SUPABASE environment variables. Please set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
}

/* 🟢 1. Admin-level client (Service Role) — bypasses RLS */
export const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* 🟢 2. Alias for older code compatibility */
export const supabaseServer = serviceClient;

/* 🟢 3. Create cookie-aware anon client for server-side session reads */
export function getServerClient() {
  const cookieStore = cookies();

  const access_token = cookieStore.get("sb-access-token")?.value;
  const refresh_token = cookieStore.get("sb-refresh-token")?.value;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // if cookies are present, restore manually
  if (access_token && refresh_token) {
    client.auth.setSession({
      access_token,
      refresh_token,
    });
  }

  return client;
}

/* 🟢 4. Create simple anon client (used by login route) */
export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
