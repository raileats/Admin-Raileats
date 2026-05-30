// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export type Restro = {
  RestroCode: number;
  OwnerName?: string | null;
  RestroName?: string | null;
  OwnerPhone?: string | number | null;
  RestroPhone?: string | number | null;
  RestroAddress?: string | null;
  City?: string | null;
  State?: string | null;
  District?: string | null;
  PinCode?: string | number | null;
  FSSAINumber?: string | number | null;
  GSTNumber?: string | null;
  GSTType?: string | null;
  [key: string]: any;
};

function normalizeRestro(row: any): Restro {
  return {
    ...row,
    OwnerPhone:
      row?.OwnerPhone === null || row?.OwnerPhone === undefined
        ? ""
        : String(row.OwnerPhone),
    RestroPhone:
      row?.RestroPhone === null || row?.RestroPhone === undefined
        ? ""
        : String(row.RestroPhone),
  };
}

export async function getRestroById(
  restroCode: number
): Promise<Restro | null> {
  try {
    const { data, error } = await supabase
      .from("RestroMaster")
      .select("*")
      .eq("RestroCode", restroCode)
      .maybeSingle();

    if (error) {
      console.error("getRestroById error:", error);
      return null;
    }

    if (!data) return null;

    return normalizeRestro(data);
  } catch (err: any) {
    console.error("getRestroById unexpected:", err);
    return null;
  }
}

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

export async function updateRestroBasic(
  restroCode: number,
  payload: Partial<Restro>
) {
  if (!restroCode) {
    return { success: false, error: "Invalid RestroCode" };
  }

  try {
    const { data, error } = await supabase
      .from("RestroMaster")
      .update({
        ...payload,
        UpdatedAt: new Date().toISOString(),
      })
      .eq("RestroCode", restroCode)
      .select("*")
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

    return { success: true, data: normalizeRestro(data) };
  } catch (err: any) {
    console.error("updateRestroBasic unexpected:", err);
    return {
      success: false,
      error: err?.message ?? "Unknown error",
    };
  }
}
