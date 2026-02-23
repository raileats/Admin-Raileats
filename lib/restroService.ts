// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ---------------- TYPES ---------------- */

export type Restro = {
  RestroCode: number;
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
  [key: string]: any;
};

/* ---------------- GET ---------------- */

export async function getRestroById(restroCode: number) {
  const { data, error } = await supabase
    .from("RestroMaster") // EXACT CASE
    .select("*")
    .eq("RestroCode", restroCode) // EXACT CASE
    .single();

  if (error) {
    console.error("getRestroById error:", error);
    return null;
  }

  return data as Restro;
}

/* ---------------- UPDATE BASIC ---------------- */

export async function updateRestroBasic(
  restroCode: number,
  payload: Partial<Restro>
) {
  if (!restroCode) {
    return { success: false, error: "Invalid RestroCode" };
  }

  const { data, error } = await supabase
    .from("RestroMaster") // EXACT TABLE NAME
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
      UpdatedAt: new Date().toISOString(), // optional
    })
    .eq("RestroCode", restroCode) // PRIMARY KEY MATCH
    .select();

  if (error) {
    console.error("updateRestroBasic error:", error);
    return { success: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return { success: false, error: "No rows updated (check RestroCode)" };
  }

  return { success: true, data: data[0] };
}
