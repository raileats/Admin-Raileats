// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type definition for one Restro row
export type Restro = {
  restro_code: number;
  station_code: string;
  station_name: string;
  restro_name: string;
  brand_name?: string | null;
  raileats?: number | boolean | null;
  is_irctc_approved?: number | boolean | null;
  irctc?: number | boolean | null;
  rating?: number | null;
  is_pure_veg?: number | boolean | null;
  restro_display_photo?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  restro_email?: string | null;
  restro_phone?: string | null;
  fssai_number?: string | null;
  fssai_expiry_date?: string | null;
};

export async function getRestroById(restroCode: number): Promise<Restro | null> {
  const { data, error } = await supabase
    .from("RestroMaster")
    .select(`
      restro_code,
      station_code,
      station_name,
      restro_name,
      brand_name,
      raileats,
      is_irctc_approved,
      irctc,
      rating,
      is_pure_veg,
      restro_display_photo,
      owner_name,
      owner_email,
      owner_phone,
      restro_email,
      restro_phone,
      fssai_number,
      fssai_expiry_date
    `)
    .eq("restro_code", restroCode)
    .single();

  if (error) {
    console.error("getRestroById error:", error.message);
    return null;
  }

  return data as Restro;
}
