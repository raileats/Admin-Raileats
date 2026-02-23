// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

/* ======================================================
   SUPABASE CLIENT
====================================================== */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ======================================================
   TYPES
====================================================== */

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

/* ======================================================
   GET BY RESTROCODE
====================================================== */

export async function getRestroById(
  restroCode: number
): Promise<Restro | null> {
  try {
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
  } catch (err: any) {
    console.error("getRestroById unexpected:", err);
    return null;
  }
}

/* ======================================================
   SAFE GET (Used in layout.tsx)
====================================================== */

export async function safeGetRestro(restroCode: number) {
  try {
    const restro = await getRestroById(restroCode);

    if (!restro) {
      return { restro: null, error: "Restro not found" };
    }

    return { restro, error: null };
  } catch (err: any) {
    return {
      restro: null,
      error: err?.message ?? "Unknown error",
    };
  }
}

/* ======================================================
   UPDATE BASIC INFORMATION
====================================================== */

export async function updateRestroBasic(
  restroCode: number,
  payload: Partial<Restro>
) {
  if (!restroCode) {
    return { success: false, error: "Invalid RestroCode" };
  }

  try {
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
        UpdatedAt: new Date().toISOString(),
      })
      .eq("RestroCode", restroCode) // PRIMARY KEY MATCH
      .select()
      .maybeSingle();

    if (error) {
      console.error("updateRestroBasic error:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: false,
        error: "No rows updated (check RestroCode match)",
      };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("updateRestroBasic unexpected:", err);
    return {
      success: false,
      error: err?.message ?? "Unknown error",
    };
  }
}
