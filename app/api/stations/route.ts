// app/api/stations/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const stationId = (url.searchParams.get("stationId") ?? "").trim();
    const stationName = (url.searchParams.get("stationName") ?? "").trim();
    const stationCode = (url.searchParams.get("stationCode") ?? "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? PAGE_SIZE) || PAGE_SIZE));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const cols = [
      "StationId",
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
      "StationImage",
    ].join(",");

    let query = supabaseServer
      .from("Stations")
      .select(cols, { count: "exact" })
      .order("StationId", { ascending: true })
      .range(from, to);

    if (stationId && /^\d+$/.test(stationId)) {
      query = query.eq("StationId", Number(stationId));
    }

    if (stationName) {
      query = query.ilike("StationName", `%${stationName}%`);
    }

    if (stationCode) {
      query = query.ilike("StationCode", `%${stationCode}%`);
    }

    if (!stationId && !stationName && !stationCode && q.length >= 1) {
      query = query.or(
        `StationName.ilike.%${q}%,StationCode.ilike.%${q}%,State.ilike.%${q}%,District.ilike.%${q}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("stations api error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      rows: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (e: any) {
    console.error("api/stations GET error", e);
    return NextResponse.json(
      { error: e.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
