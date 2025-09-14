// app/api/testdb/route.ts
import { db } from "../../../lib/db";

export async function GET() {
  try {
    if (!db) {
      return new Response(JSON.stringify({ error: "Supabase client not initialized" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await db.from("Stations").select("*").limit(1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message || error }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
