// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Restro type following your DB column casing (PascalCase)
export type Restro = {
  RestroCode: number;
  StationCode?: string | null;
  StationName?: string | null;
  RestroName?: string | null;
  BrandName?: string | null;
  Raileats?: number | boolean | null;
  IsIrctcApproved?: number | boolean | null;
  IRCTC?: number | boolean | null;
  Rating?: number | null;
  IsPureVeg?: number | boolean | null;
  RestroDisplayPhoto?: string | null;
  OwnerName?: string | null;
  OwnerEmail?: string | null;
  OwnerPhone?: string | null;
  RestroEmail?: string | null;
  RestroPhone?: string | null;
  FSSAINumber?: string | null;
  FSSAIExpiryDate?: string | null;
  // add any other DB columns here (with exact casing)
};

export async function getRestroById(restroCode: number): Promise<Restro | null> {
  const { data, error } = await supabase
    .from("RestroMaster")
    .select(`
      RestroCode,
      StationCode,
      StationName,
      RestroName,
      BrandName,
      Raileats,
      IsIrctcApproved,
      IRCTC,
      Rating,
      IsPureVeg,
      RestroDisplayPhoto,
      OwnerName,
      OwnerEmail,
      OwnerPhone,
      RestroEmail,
      RestroPhone,
      FSSAINumber,
      FSSAIExpiryDate
    `)
    .eq("RestroCode", restroCode)
    .single();

  if (error) {
    console.error("getRestroById error:", error.message ?? error);
    return null;
  }

  return (data as Restro) ?? null;
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
