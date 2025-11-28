import { NextResponse } from "next/server";
import { serviceClient } from "../../../../lib/supabaseServer";


type TrainSummary = {
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;
  stationFrom: string | null;
  stationTo: string | null;
  runningDays: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function GET(req: Request) {
  try {
    const supa = serviceClient;
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    let query = supa
      .from("TrainRoute")
      .select(
        "trainId, trainNumber, trainName, stationFrom, stationTo, runningDays, StnNumber, status, created_at, updated_at",
      )
      .eq("StnNumber", 1) // sirf origin station ko train master maan rahe
      .order("trainNumber", { ascending: true })
      .limit(5000);

    if (q) {
      // trainId / trainNumber / trainName 3on pe basic search
      const num = Number(q);
      if (Number.isFinite(num)) {
        query = query.or(
          `trainId.eq.${num},trainNumber.eq.${num},trainName.ilike.%${q}%`,
        );
      } else {
        query = query.or(`trainName.ilike.%${q}%,stationFrom.ilike.%${q}%,stationTo.ilike.%${q}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("admin trains list error", error);
      return NextResponse.json(
        { ok: false, error: "db_error" },
        { status: 500 },
      );
    }

    const trains: TrainSummary[] = (data || []) as any[];

    return NextResponse.json({
      ok: true,
      trains,
    });
  } catch (e) {
    console.error("admin trains list server_error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
