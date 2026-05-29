// app/api/stations/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const stationId = (url.searchParams.get("stationId") ?? "").trim();
    const stationName = (url.searchParams.get("stationName") ?? "").trim();
    const stationCode = (url.searchParams.get("stationCode") ?? "").trim();

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

    let allRows: any[] = [];
    let from = 0;
    let to = PAGE_SIZE - 1;

    while (true) {
      let query = supabaseServer
        .from("Stations")
        .select(cols)
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

      const { data, error } = await query;

      if (error) {
        console.error("stations api error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        break; // no more rows
      }

      allRows.push(...data);

      // stop if last page
      if (data.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
      to += PAGE_SIZE;
    }

    return NextResponse.json({
      ok: true,
      rows: allRows,
      total: allRows.length,
    });
  } catch (e: any) {
    console.error("api/stations GET error", e);
    return NextResponse.json(
      { error: e.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
