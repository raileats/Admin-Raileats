import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { outletId, stationSettings, documents } = body;

    if (!outletId) {
      return NextResponse.json({ error: "Missing outletId" }, { status: 400 });
    }

    const q = `UPDATE outlets
      SET min_order = $1,
          open_time = $2,
          close_time = $3,
          cutoff_minutes = $4,
          fssai = $5,
          documents = $6,
          updated_at = now()
      WHERE outlet_id = $7
      RETURNING *`;

    const vals = [
      stationSettings?.minOrder || null,
      stationSettings?.openTime || null,
      stationSettings?.closeTime || null,
      stationSettings?.cutOffMinutes || null,
      documents?.fssai || null,
      JSON.stringify(documents || {}),
      outletId,
    ];

    const updated = await db.query(q, vals);

    if (updated.rowCount === 0) {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }

    return NextResponse.json({ outlet: updated.rows[0] }, { status: 200 });
  } catch (err) {
    console.error("Error updating outlet:", err);
    return NextResponse.json({ error: "Failed to update outlet" }, { status: 500 });
  }
}
