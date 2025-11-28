// app/api/admin/trains/route.ts
import { NextResponse } from "next/server";
import { serviceClient } from "../../../../lib/supabaseServer";

type AdminTrainListRow = {
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;

  // naya data jo list me dikhana hai
  stnNumber: number | string | null;
  stationCode: string | null;
  distance: string | null;
  stoptime: string | null;

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

    // ⭐ yahan "*" hi rakhte hain, taaki koi missing-column error na aaye
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

    // har DB row ko direct list row bana rahe hain
    let trains: AdminTrainListRow[] = rows.map((row) => ({
      trainId: Number(row.trainId) || 0,
      trainNumber:
        typeof row.trainNumber === "number"
          ? row.trainNumber
          : row.trainNumber ?? null,
      trainName: row.trainName ?? null,

      stnNumber:
        row.StnNumber !== undefined && row.StnNumber !== null
          ? row.StnNumber
          : null,
      stationCode: row.StationCode ?? null,
      distance: row.Distance ?? null,
      stoptime: row.Stoptime ?? null,

      runningDays: row.runningDays ?? null,
      status: row.status ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
    }));

    // 🔍 search: Train ID, Number, Name, StationCode sab pe
    if (q) {
      trains = trains.filter((t) => {
        const fields: string[] = [];

        if (t.trainId) fields.push(String(t.trainId));
        if (t.trainNumber != null) fields.push(String(t.trainNumber));
        if (t.trainName) fields.push(t.trainName);
        if (t.stationCode) fields.push(t.stationCode);
        if (t.runningDays) fields.push(t.runningDays);
        if (t.distance) fields.push(String(t.distance));
        if (t.stnNumber != null) fields.push(String(t.stnNumber));

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
