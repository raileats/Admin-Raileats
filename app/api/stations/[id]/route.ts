// ✅ path: app/api/stations/[id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase server client not initialized — missing env vars");
      return NextResponse.json({ error: "server_client_not_initialized" }, { status: 500 });
    }

    const id = params.id;
    const body = await request.json();

    const pkColumn = "StationId"; // adjust if DB column differs

    const allowed = new Set([
      "StationName",
      "StationCode",
      "Category",
      "EcatRank",
      "Division",
      "RailwayZone",
      "EcatZone",
      "District",
      "State",
      "Lat",
      "Long",
      "Address",
      "ReGroup",
      "is_active",
    ]);

    const updates: Record<string, any> = {};
    for (const key of Object.keys(body || {})) {
      if (allowed.has(key)) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Stations")
      .update(updates)
      .eq(pkColumn, id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("PATCH /api/stations/[id] error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
