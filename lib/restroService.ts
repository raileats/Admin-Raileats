// lib/restroService.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getRestroById(restroCode: number) {
  const { data, error } = await supabase
    .from("RestroMaster")
    .select(`
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
    `)
    .eq("restro_code", restroCode)
    .single();

  if (error) throw error;
  return data;
}
