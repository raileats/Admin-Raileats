// lib/db.ts
import supabaseDefault, { supabase as namedSupabase } from "./supabaseClient";

export const supabase = namedSupabase ?? supabaseDefault ?? null;
export const db = supabase;

export default db;
