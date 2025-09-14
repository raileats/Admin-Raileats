// app/api/outlets/basic/route.ts
// Simplified outlets creation endpoint that avoids using db.query()
// (Supabase JS client does not expose a .query() method).
// Instead we generate a server-side unique outletId and insert normally.

import { db } from "../../../lib/db";

function generateOutletId(): string {
  // simple deterministic-ish id: OUT + last 6 digits of timestamp + 3 random digits
  const tsPart = String(Date.now()).slice(-6); // last 6 digits of ms timestamp
  const rnd = Math.floor(Math.random() * 900 + 100); // 100..999
  return `OUT${tsPart}${rnd}`; // e.g. OUT345678123
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // validate required fields as per your schema (example)
    const { name, address, station_id, contact } = body || {};
    if (!name) {
      return new Response(JSON.stringify({ error: "Missing `name`" }), { status: 400 });
    }

    // generate an outlet id server-side instead of using DB sequence
    const outletId = generateOutletId();

    const payload = {
      outlet_id: outletId,
      name,
      address: address ?? null,
      station_id: station_id ?? null,
      contact: contact ?? null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await db.from("Outlets").insert(payload).select().single();

    if (error) {
      console.error("Insert outlet error:", error);
      return new Response(JSON.stringify({ error: error.message || error }), { status: 500 });
    }

    return new Response(JSON.stringify({ data }), { status: 201 });
  } catch (err: any) {
    console.error("outlets/basic route unexpected error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
}
