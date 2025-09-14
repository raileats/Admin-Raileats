// lib/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVER_URL = process.env.SUPABASE_URL ?? "";
const SERVER_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? "";

const URL = SERVER_URL || PUBLIC_URL;
const KEY = SERVER_KEY || PUBLIC_KEY;

let supabase: SupabaseClient | null = null;

try {
  if (URL && KEY) {
    supabase = createClient(URL, KEY);
  } else {
    supabase = null;
  }
} catch (e) {
  supabase = null;
}

export default supabase;
export { supabase };
