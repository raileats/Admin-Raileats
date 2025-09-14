// app/api/vendors/route.ts
import { db } from "../../lib/db";

async function getAdminSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only key
  if (!url || !key) return null;

  const mod = await import("@supabase/supabase-js");
  return mod.createClient(url, key);
}

export async function GET(request: Request) {
  try {
    const adminClient = await getAdminSupabaseClient();

    if (adminClient) {
      const { data, error } = await adminClient.from("Vendors").select("*").limit(100);
      if (error) {
        console.error("vendors (admin) supabase error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    } else {
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
