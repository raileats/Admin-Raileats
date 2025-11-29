import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";

type TrainRouteRow = {
  trainId?: number;
  trainNumber: number | string | null;
  trainName?: string | null;
  stationFrom?: string | null;
  stationTo?: string | null;
  runningDays?: string | null;
  StnNumber?: number | null;
  StationCode?: string | null;
  StationName?: string | null;
  Arrives?: string | null;
  Departs?: string | null;
  Stoptime?: string | null;
  Distance?: string | null;
  Platform?: string | null;
  Route?: number | null;
  Day?: number | null;
};

function parseCsv(text: string): any[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.length) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const cols = line.split(",");
    const obj: any = {};

    header.forEach((h, idx) => {
      // simple unquote
      let v = cols[idx] ?? "";
      v = v.replace(/^"(.*)"$/, "$1").trim();
      obj[h] = v === "" ? null : v;
    });

    rows.push(obj);
  }

  return rows;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "no_file" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const rawRows = parseCsv(text);

    if (!rawRows.length) {
      return NextResponse.json(
        { ok: false, error: "empty_csv" },
        { status: 400 },
      );
    }

    const supa = serviceClient;

    // ---- 1) Normalize + group by trainNumber ----
    const byTrainNumber = new Map<string, TrainRouteRow[]>();
    const trainNumbersSet = new Set<string>();

    for (const r of rawRows) {
      const tnRaw = r.trainNumber ?? r.train_no ?? r.train_no_;
      if (tnRaw == null) continue;

      const tnStr = String(tnRaw).trim();
      if (!tnStr) continue;

      trainNumbersSet.add(tnStr);

      const row: TrainRouteRow = {
        trainNumber: tnStr,
        trainName: r.trainName ?? r.train_name ?? null,
        stationFrom: r.stationFrom ?? r.station_from ?? null,
        stationTo: r.stationTo ?? r.station_to ?? null,
        runningDays: r.runningDays ?? r.running_days ?? null,
        StnNumber:
          r.StnNumber != null
            ? Number(r.StnNumber)
            : r.stn_no != null
            ? Number(r.stn_no)
            : null,
        StationCode: r.StationCode ?? r.station_code ?? null,
        StationName: r.StationName ?? r.station_name ?? null,
        Arrives: r.Arrives ?? r.arrives ?? null,
        Departs: r.Departs ?? r.departs ?? null,
        Stoptime: r.Stoptime ?? r.stoptime ?? null,
        Distance: r.Distance ?? r.distance ?? null,
        Platform: r.Platform ?? r.platform ?? null,
        Route:
          r.Route != null
            ? Number(r.Route)
            : r.route != null
            ? Number(r.route)
            : null,
        Day:
          r.Day != null
            ? Number(r.Day)
            : r.day != null
            ? Number(r.day)
            : null,
      };

      if (!byTrainNumber.has(tnStr)) {
        byTrainNumber.set(tnStr, []);
      }
      byTrainNumber.get(tnStr)!.push(row);
    }

    if (!byTrainNumber.size) {
      return NextResponse.json(
        { ok: false, error: "no_valid_rows" },
        { status: 400 },
      );
    }

    // ---- 2) Existing trains ke trainId nikaalo ----
    const trainNumbers = Array.from(trainNumbersSet);
    const { data: existingRows, error: existingErr } = await supa
      .from("TrainRoute")
      .select("trainNumber, trainId")
      .in("trainNumber", trainNumbers);

    if (existingErr) {
      console.error("upload fetch existing error", existingErr);
      return NextResponse.json(
        { ok: false, error: "db_error_existing" },
        { status: 500 },
      );
    }

    const existingMap = new Map<string, number>(); // trainNumber -> trainId
    (existingRows || []).forEach((r: any) => {
      const key = String(r.trainNumber);
      if (!existingMap.has(key)) {
        existingMap.set(key, r.trainId);
      }
    });

    // ---- 3) Max trainId for NEW trains ----
    const { data: maxData, error: maxErr } = await supa
      .from("TrainRoute")
      .select("trainId")
      .order("trainId", { ascending: false })
      .limit(1);

    if (maxErr) {
      console.error("upload max trainId error", maxErr);
      return NextResponse.json(
        { ok: false, error: "db_error_maxid" },
        { status: 500 },
      );
    }

    let nextTrainId =
      maxData && maxData.length ? Number(maxData[0].trainId) + 1 : 1;

    // ---- 4) For all OLD trains, delete their existing rows ----
    const existingTrainNumbers = Array.from(existingMap.keys());
    if (existingTrainNumbers.length) {
      const { error: delErr } = await supa
        .from("TrainRoute")
        .delete()
        .in("trainNumber", existingTrainNumbers);

      if (delErr) {
        console.error("upload delete old rows error", delErr);
        return NextResponse.json(
          { ok: false, error: "delete_old_rows_error" },
          { status: 500 },
        );
      }
    }

    // ---- 5) Prepare all new rows for insert ----
    const insertRows: any[] = [];

    for (const [tnStr, list] of byTrainNumber.entries()) {
      let trainId = existingMap.get(tnStr);
      if (!trainId) {
        // completely NEW train
        trainId = nextTrainId++;
      }

      for (const r of list) {
        insertRows.push({
          trainId,
          trainNumber: r.trainNumber,
          trainName: r.trainName ?? null,
          stationFrom: r.stationFrom ?? null,
          stationTo: r.stationTo ?? null,
          runningDays: r.runningDays ?? null,
          StnNumber: r.StnNumber ?? null,
          StationCode: r.StationCode ?? null,
          StationName: r.StationName ?? null,
          Arrives: r.Arrives ?? null,
          Departs: r.Departs ?? null,
          Stoptime: r.Stoptime ?? null,
          Distance: r.Distance ?? null,
          Platform: r.Platform ?? null,
          Route: r.Route ?? null,
          Day: r.Day ?? null,
          status: "ACTIVE", // default when uploading
        });
      }
    }

    if (!insertRows.length) {
      return NextResponse.json(
        { ok: false, error: "nothing_to_insert" },
        { status: 400 },
      );
    }

    // ---- 6) Insert all rows ----
    const { error: insErr } = await supa
      .from("TrainRoute")
      .insert(insertRows);

    if (insErr) {
      console.error("upload insert error", insErr);
      return NextResponse.json(
        { ok: false, error: "insert_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: insertRows.length,
      trainsAffected: byTrainNumber.size,
    });
  } catch (e) {
    console.error("upload csv server_error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
