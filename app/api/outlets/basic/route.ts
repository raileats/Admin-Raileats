// app/api/outlets/basic/route.ts
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // simple server-side ID generator fallback (sequence-based logic removed for portability)
    const tsPart = String(Date.now()).slice(-6);
    const rnd = Math.floor(Math.random() * 900 + 100);
    const outletId = `OUT${tsPart}${rnd}`;

    const payload = {
      outlet_id: outletId,
      name: body.name ?? null,
      address: body.address ?? null,
      station_id: body.station_id ?? null,
      contact: body.contact ?? null,
      created_at: new Date().toISOString(),
    };

    if (!db) {
      return new Response(JSON.stringify({ error: "Supabase client not initialized" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await db.from("Outlets").insert(payload).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message || error }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
