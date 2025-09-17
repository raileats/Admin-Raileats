// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client with anon key (safe for reads)
const supabase = createClient(supabaseUrl, supabaseAnon);

// Type definition for one row (optional, for TypeScript)
export type Restro = {
  restro_code: number;
  station_code: string;
  station_name: string;
  restro_name: string;
  brand_name?: string | null;
  raileats_status?: "On" | "Off" | number | null;
  is_irctc_approved?: boolean | number | null;
  irctc_status?: "On" | "Off" | number | null;
  rating?: number | null;
  is_pure_veg?: boolean | number | null;
  restro_display_photo?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  owner_phone?: string | null;
  restro_email?: string | null;
  restro_phone?: string | null;
};

export async function getRestroById(restroCode: number): Promise<Restro | null> {
  const { data, error } = await supabase
    .from("RestroMaster")
    .select(
      `
      restro_code,
      station_code,
      station_name,
      restro_name,
      brand_name,
      raileats_status,
      is_irctc_approved,
      irctc_status,
      rating,
      is_pure_veg,
      restro_display_photo,
      owner_name,
      owner_email,
      owner_phone,
      restro_email,
      restro_phone
    `
    )
    .eq("restro_code", restroCode)
    .single();

  if (error) {
    console.error("getRestroById error:", error.message);
    throw error;
  }

  return data;
}
