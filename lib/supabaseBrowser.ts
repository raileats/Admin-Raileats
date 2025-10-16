// lib/supabaseBrowser.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // don't throw here (so client app can still boot) — log for debugging
  // If you prefer stricter behavior, uncomment throw.
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// ensure single instance in dev/hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __supabase: SupabaseClient | undefined;
}

const getClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) return undefined as unknown as SupabaseClient;
  // @ts-ignore global caching
  if (typeof global !== "undefined" && (global as any).__supabase) {
    // @ts-ignore
    return (global as any).__supabase as SupabaseClient;
  }
  const client = createClient(supabaseUrl, supabaseAnonKey);
  // @ts-ignore
  if (typeof global !== "undefined") (global as any).__supabase = client;
  return client;
};

export const supabaseBrowser = getClient();
export const supabase = supabaseBrowser;
