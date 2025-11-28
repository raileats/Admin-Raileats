// app/api/admin/trains/route.ts
import { NextResponse } from "next/server";
import { serviceClient } from "../../../../lib/supabaseServer";

type AdminTrainListRow = {
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
    const qRaw = (url.searchParams.get("q") || "").trim();
    const q = qRaw.toUpperCase();

    // ⚠️ Important: select("*") so even if some columns
    // (status / created_at / updated_at) are missing, query won’t fail
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

    // Group by trainId – first row of each train will be used as “header”
    const byTrainId = new Map<number, AdminTrainListRow>();

    for (const row of rows) {
      const id = Number(row.trainId);
      if (!Number.isFinite(id)) continue;
      if (byTrainId.has(id)) continue;

      byTrainId.set(id, {
        trainId: id,
        trainNumber:
          typeof row.trainNumber === "number"
            ? row.trainNumber
            : row.trainNumber ?? null,
        trainName: row.trainName ?? null,
        stationFrom: row.stationFrom ?? null,
        stationTo: row.stationTo ?? null,
        runningDays: row.runningDays ?? null,
        status: row.status ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      });
    }

    let trains = Array.from(byTrainId.values());

    // 🔍 search filter (Train ID / Number / Name / From / To)
    if (q) {
      trains = trains.filter((t) => {
        const fields: string[] = [];
        if (t.trainId) fields.push(String(t.trainId));
        if (t.trainNumber != null) fields.push(String(t.trainNumber));
        if (t.trainName) fields.push(t.trainName);
        if (t.stationFrom) fields.push(t.stationFrom);
        if (t.stationTo) fields.push(t.stationTo);
        if (t.runningDays) fields.push(t.runningDays);

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
