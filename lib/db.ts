// lib/db.ts
// Quick shim: re-export the supabase client so imports from "@/lib/db" work.
import supabase from './supabaseClient';

export default supabase;
export const db = supabase;
export { supabase }; // named export bhi diya taaki `import { supabase }` kaam kare
