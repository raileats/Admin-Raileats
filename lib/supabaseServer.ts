// lib/supabaseServer.ts
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVER env vars");
}

export const supabaseServer = createServerClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  cookies,
});
