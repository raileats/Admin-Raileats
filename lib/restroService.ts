// lib/restroService.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const PUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!PUB_URL || !PUB_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
  );
}

export const supabase: SupabaseClient = createClient(PUB_URL, PUB_KEY);

/* ---------------- TYPES ---------------- */

export type Restro = {
  RestroCode?: number;
  OwnerName?: string;
  RestroName?: string;
  OwnerPhone?: number;
  RestroAddress?: string;
  City?: string;
  State?: string;
  District?: string;
  PinCode?: number;
  FSSAINumber?: number;
  GSTNumber?: string;
  GSTType?: string;
  [k: string]: any;
};

/* ---------------- GET ---------------- */

export async function getRestroById(
  restroCode: number
): Promise<Restro | null> {
  const { data, error } = await supabase
    .from("RestroMaster") // ⚠️ EXACT case
    .select("*")
    .eq("RestroCode", restroCode) // ⚠️ EXACT case
    .limit(1);

  if (error) {
    console.error("getRestroById error:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data[0] as Restro;
}

/* ---------------- UPDATE ---------------- */

export async function updateRestroBasic(
  restroCode: number,
  payload: Partial<Restro>
) {
  if (!restroCode) {
    return { data: null, error: "Invalid RestroCode" };
  }

  const { data, error } = await supabase
    .from("RestroMaster") // ⚠️ EXACT table name
    .update({
      OwnerName: payload.OwnerName ?? null,
      RestroName: payload.RestroName ?? null,
      OwnerPhone: payload.OwnerPhone ?? null,
      RestroAddress: payload.RestroAddress ?? null,
      City: payload.City ?? null,
      State: payload.State ?? null,
      District: payload.District ?? null,
      PinCode: payload.PinCode ?? null,
      FSSAINumber: payload.FSSAINumber ?? null,
      GSTNumber: payload.GSTNumber ?? null,
      GSTType: payload.GSTType ?? null,
    })
    .eq("RestroCode", restroCode) // ⚠️ PRIMARY KEY MATCH
    .select();

  if (error) {
    console.error("updateRestroBasic error:", error);
    return { data: null, error: error.message };
  }

  if (!data || data.length === 0) {
    return { data: null, error: "No rows updated" };
  }

  return { data: data[0], error: null };
}
