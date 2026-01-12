// app/api/stations/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();

    const cols = [
      "StationCode",
      "StationName",
      "State",
    ].join(",");

    let query = supabaseServer
      .from("Stations")
      .select(cols)
      .order("StationName", { ascending: true });

    // 🔍 OPTIONAL server-side search (safe, no limit)
    if (q.length >= 1) {
      query = query.or(
        `StationName.ilike.%${q}%,StationCode.ilike.%${q}%`
      );
    }

    // ❗❗ IMPORTANT: NO LIMIT HERE ❗❗
    const { data, error } = await query;

    if (error) {
      console.error("stations api error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      rows: data ?? [],
      total: data?.length ?? 0,
    });
  } catch (e: any) {
    console.error("api/stations GET error", e);
    return NextResponse.json(
      { error: e.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
