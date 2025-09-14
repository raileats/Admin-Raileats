// lib/db.ts
// Single source of truth for DB / supabase client exports.
// We export named `supabase` and `db`, and also provide a default export `db`
// so older files using default import keep working.

import { supabase as _supabase } from "./supabaseClient";

export const supabase = _supabase;
export const db = _supabase;

export default db;
