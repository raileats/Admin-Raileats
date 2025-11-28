// app/api/admin/trains/route.ts
import { NextResponse } from "next/server";
import { serviceClient } from "../../../../lib/supabaseServer";

type AdminTrainListRow = {
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;

  // EXACT same names as frontend type
  StnNumber: number | null;
  StationCode: string | null;
  Distance: string | null;
  Stoptime: string | null;

  runningDays: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function GET(req: Request) {
  try {
    const supa = serviceClient;
    const url = new URL(req.url);
    const qRaw = (url.searchParams.get("q") || "").trim();
    const q = qRaw.toUpperCase();

    // sab columns lo taaki koi column-mismatch error na aaye
    const { data, error } = await supa
      .from("TrainRoute")
      .select("*")
      .order("trainId", { ascending: true })
      .order("StnNumber", { ascending: true });

    if (error) {
      console.error("admin trains list error", error);
      return NextResponse.json(
        { ok: false, error: "db_error" },
        { status: 500 },
      );
    }

    const rows = (data || []) as any[];

    // har DB row -> ek table row (route wise list)
    let trains: AdminTrainListRow[] = rows.map((row) => ({
      trainId: Number(row.trainId) || 0,
      trainNumber:
        typeof row.trainNumber === "number"
          ? row.trainNumber
          : row.trainNumber ?? null,
      trainName: row.trainName ?? null,

      // yahi 4 fields UI me dikh rahe hain
      StnNumber:
        row.StnNumber !== undefined && row.StnNumber !== null
          ? Number(row.StnNumber)
          : null,
      StationCode: row.StationCode ?? null,
      Distance: row.Distance ?? null,
      Stoptime: row.Stoptime ?? null,

      runningDays: row.runningDays ?? null,
      status: row.status ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    }));

    // 🔍 search: Train ID / Number / Name / StationCode / RunningDays
    if (q) {
      trains = trains.filter((t) => {
        const fields: string[] = [];
        if (t.trainId) fields.push(String(t.trainId));
        if (t.trainNumber != null) fields.push(String(t.trainNumber));
        if (t.trainName) fields.push(t.trainName);
        if (t.StationCode) fields.push(t.StationCode);
        if (t.runningDays) fields.push(t.runningDays);
        if (t.StnNumber != null) fields.push(String(t.StnNumber));
        if (t.Distance) fields.push(String(t.Distance));

        const hay = fields.join(" ").toUpperCase();
        return hay.includes(q);
      });
    }

    return NextResponse.json({ ok: true, trains });
  } catch (e) {
    console.error("admin trains list server_error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
