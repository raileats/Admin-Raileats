// path: app/api/stations/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase server client not initialized (missing envs)");
      return NextResponse.json({ error: "server_client_not_initialized" }, { status: 500 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

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
    ].join(",");

    let res;
    if (q) {
      // Use a safe sanitized query piece — supabase .or expects explicit .ilike.%pattern%
      const pattern = `%${q}%`;
      res = await supabase
        .from("Stations")
        .select(cols)
        .or(`StationName.ilike.${pattern},StationCode.ilike.${pattern}`)
        .order("StationName", { ascending: true })
        .limit(200);
    } else {
      res = await supabase.from("Stations").select(cols).order("StationName", { ascending: true }).limit(200);
    }

    const { data, error } = res as { data: any[] | null; error: any | null };

    if (error) {
      console.error("supabase list error", error);
      return NextResponse.json({ error: error?.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error("api/stations GET error", e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
