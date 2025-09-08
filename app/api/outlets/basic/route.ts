import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      outletName,
      stationId,
      ownerName,
      ownerMobile,
      ownerEmail,
      outletMobile,
      outletLat,
      outletLong,
      outletStatus,
    } = body;

    if (!outletName || !stationId || !ownerMobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // generate sequence-based outletId
    const seqRes = await db.query(
      "SELECT 'OUT' || LPAD(nextval('outlets_seq')::text, 6, '0') as outlet_id"
    );
    const outletId = seqRes.rows[0].outlet_id;

    const insert = await db.query(
      `INSERT INTO outlets (
        outlet_id, name, station_id, owner_name, owner_mobile, owner_email,
        outlet_mobile, lat, long, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        outletId,
        outletName,
        stationId,
        ownerName || null,
        ownerMobile,
        ownerEmail || null,
        outletMobile || null,
        outletLat || null,
        outletLong || null,
        outletStatus ?? true,
      ]
    );

    return NextResponse.json({ outlet: insert.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Error creating outlet basic:", err);
    return NextResponse.json({ error: "Failed to create outlet" }, { status: 500 });
  }
}
