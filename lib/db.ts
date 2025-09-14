// lib/db.ts
import { supabase } from "./supabaseClient";

export const db = supabase;   // alias
export { supabase };          // direct export
