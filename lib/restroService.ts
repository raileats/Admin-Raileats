// lib/restroService.ts
// Lightweight, robust restro service.
// - uses public client by default (works on server/client), you can swap to supabaseServer if you have server-only client.
// - performs normalization of returned row keys to avoid case/spacing issues (e.g., "District" vs "district").

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const PUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!PUB_URL || !PUB_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
  );
}

export const supabase: SupabaseClient = createClient(PUB_URL, PUB_KEY);

/** Restro shape (loose) */
export type Restro = {
  RestroCode?: number | string;
  RestroAddress?: string;
  City?: string;
  State?: string;
  District?: string;
  PinCode?: string;
  Latitude?: string;
  Longitude?: string;
  FSSAINumber?: string;
  FSSAIExpiry?: string;
  GSTNumber?: string;
  GSTType?: string;
  [k: string]: any;
};

/**
 * Normalize keys from supabase row into a predictable Restro object.
 * This function looks for common variants (case-insensitive, with/without spaces, snake_case)
 * and maps them to canonical property names used by the UI (e.g., District, State, RestroAddress).
 */
function normalizeRow(row: Record<string, any>): Restro {
  if (!row) return {};

  // create a map of normalizedKey -> actualKey for quick lookup
  const keyMap: Record<string, string> = {};
  Object.keys(row).forEach((k) => {
    const nk = k.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
    keyMap[nk] = k;
  });

  function pick(possibleNames: string[]) {
    for (const n of possibleNames) {
      const nk = n.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
      if (keyMap[nk]) return row[keyMap[nk]];
    }
    return undefined;
  }

  const out: Restro = {
    RestroCode: pick(["RestroCode", "restrocode", "restro_code", "restro code"]),
    RestroAddress: pick(["RestroAddress", "restroaddress", "restro_address", "restro address", "Restro Address"]),
    City: pick(["City", "city", "town"]),
    State: pick(["State", "state"]),
    District: pick(["District", "district"]),
    PinCode: pick(["PinCode", "pincode", "Pin Code", "pin_code"]),
    Latitude: pick(["Latitude", "latitude", "lat"]),
    Longitude: pick(["Longitude", "longitude", "long", "lng"]),
    FSSAINumber: pick(["FSSAINumber", "fssainumber", "fssai_number", "FSSAI Number"]),
    FSSAIExpiry: pick(["FSSAIExpiry", "fssaiexpiry", "fssai_expiry", "FSSAI Expiry"]),
    GSTNumber: pick(["GSTNumber", "gstnumber", "gst_number", "GST Number"]),
    GSTType: pick(["GSTType", "gsttype", "gst_type"]),
  };

  // copy any other keys as-is (but avoid overwriting normalized ones)
  Object.keys(row).forEach((k) => {
    if (out[k as keyof Restro] === undefined) {
      out[k] = row[k];
    }
  });

  return out;
}

export async function getRestroById(restroCode: number): Promise<Restro | null> {
  try {
    // prefer server-only client if you have it:
    // const client = supabaseServer;
    const client = supabase;

    // fetch all columns (select '*') to avoid missing columns due to naming issues
    const q = client.from("RestroMaster").select("*").eq("RestroCode", restroCode).limit(1);
    const { data, error } = await q;

    if (error) {
      console.error("getRestroById supabase error:", error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn("getRestroById: no row found for code:", restroCode);
      return null;
    }

    const rawRow = data[0] as Record<string, any>;

    // LOG the raw row shape for debugging (check your Vercel/Server logs)
    console.log("getRestroById rawRow keys:", Object.keys(rawRow).join(", "));
    console.log("getRestroById rawRow sample:", {
      RestroCode: rawRow["RestroCode"] ?? rawRow["restrocode"] ?? rawRow["Restro Code"],
      District:
        rawRow["District"] ??
        rawRow["district"] ??
        rawRow["District "] ??
        rawRow["district "],
      State: rawRow["State"] ?? rawRow["state"],
    });

    // normalize keys and return predictable object
    const normalized = normalizeRow(rawRow);
    // optional: log normalized result
    console.log("getRestroById normalized:", {
      RestroCode: normalized.RestroCode,
      District: normalized.District,
      State: normalized.State,
      RestroAddress: normalized.RestroAddress,
    });

    return normalized;
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
