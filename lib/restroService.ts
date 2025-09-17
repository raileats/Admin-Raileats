// lib/restroService.ts
// Lightweight, robust restro service.
// - uses public client by default (works on server/client), but you can swap to supabaseServer for server-only secure calls.
// - uses select('*') to avoid missing-column issues, then returns the first row (or null).

import { createClient } from "@supabase/supabase-js";
// If you have a server-only client file (recommended for server pages), you can import it instead:
// import { supabaseServer } from "./supabaseServer";

const PUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!PUB_URL || !PUB_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment");
}

const supabase = createClient(PUB_URL, PUB_KEY);

export type Restro = {
  RestroCode?: number;
  RestroName?: string;
  OwnerName?: string;
  StationCode?: string;
  StationName?: string;
  OwnerEmail?: string;
  OwnerPhone?: any;
  BrandNameifAny?: string;
  RestroEmail?: string;
  RestroPhone?: any;
  IRCTCStatus?: number | string;
  RaileatsStatus?: number | string;
  IsIrctcApproved?: number | string;
  RestroRating?: number | null;
  IsPureVeg?: number | string;
  RestroDisplayPhoto?: string | null;
  FSSAINumber?: any;
  FSSAIExpiryDate?: string | null;
  // plus any other DB columns — they'll be returned as-is
  [k: string]: any;
};

/**
 * Fetch restro by code.
 * Uses `select('*')` to avoid missing-column/field-name mismatches.
 * Prefer to call this on the server (app/page server components) so anonymous/public client isn't exposed in the browser.
 */
export async function getRestroById(restroCode: number): Promise<Restro | null> {
  // If you prefer server-only client, uncomment below and comment the public client:
  // const client = supabaseServer;
  const client = supabase;

  try {
    const q = client.from("RestroMaster").select("*").eq("RestroCode", restroCode).limit(1);
    const { data, error } = await q;
    if (error) {
      // log to server console (Vercel logs) — helpful for debugging
      console.error("getRestroById supabase error:", error);
      return null;
    }
    if (!data || data.length === 0) return null;
    return data[0] as Restro;
  } catch (err: any) {
    console.error("getRestroById unexpected error:", err);
    return null;
  }
}

export async function safeGetRestro(restroCode: number) {
  try {
    const restro = await getRestroById(restroCode);
    if (!restro) return { restro: null, error: "Not found" };
    return { restro, error: null };
  } catch (err: any) {
    return { restro: null, error: err?.message ?? "Unknown error" };
  }
}
