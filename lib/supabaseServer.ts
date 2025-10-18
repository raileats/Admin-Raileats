// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// ✅ Used for admin operations (read/write any table)
export const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ✅ Used for session-aware requests (sets/reads cookies)
export function getServerClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies });
}
