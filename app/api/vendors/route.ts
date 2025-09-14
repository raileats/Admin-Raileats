// app/api/vendors/route.ts
// Server-side Next.js route (app directory)
// This file exports a single GET handler that fetches vendors from Supabase.
// It uses a server-side Supabase client created with a SERVICE ROLE key when available,
// otherwise it falls back to the regular `db` client (from lib/db) for read-only queries.

import { db } from "@/lib/db";

async function getAdminSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only key
  if (!url || !key) return null;

  // dynamic import so it only loads on server and does not run at module evaluation time
  const mod = await import("@supabase/supabase-js");
  return mod.createClient(url, key);
}

export async function GET(request: Request) {
  // Prefer server admin client (if you need elevated privileges), otherwise use db
  try {
    const adminClient = await getAdminSupabaseClient();

    if (adminClient) {
      // use admin client to query vendors
      const { data, error } = await adminClient.from("Vendors").select("*").limit(100);
      if (error) {
        console.error("vendors (admin) supabase error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    } else {
      // fallback: use the normal db client (imported from lib/db)
      const { data, error } = await db.from("Vendors").select("*").limit(100);
      if (error) {
        console.error("vendors (db) error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    }
  } catch (err: any) {
    console.error("vendors route unexpected error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
}
