// app/api/vendors/route.ts
import { db } from "@/lib/db"; // अगर alias नहीं चलता तो बदलकर '../../../lib/db' कर दें

// GET: fetch first 10 vendors (example)
export async function GET() {
  try {
    if (!db) {
      return new Response(JSON.stringify({ error: "Supabase client not initialized" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await db.from("Vendors").select("*").limit(10);

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
