// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  // For server usage, it's better to throw so deployment/build fails loudly if missing.
  throw new Error(
    "Missing Supabase envs. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_ equivalents) in Vercel."
  );
}

export const supabaseServer = createClient(url, serviceKey);
