// app/api/admin/trains/[trainId]/route.ts
import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";

type TrainRouteRow = {
  // id optional rakhenge, par use nahi kar rahe
  id?: number;
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;
  stationFrom: string | null;
  stationTo: string | null;
  runningDays: string | null;
  StnNumber: number | null;
  StationCode: string | null;
  StationName: string | null;
  Arrives: string | null;
  Departs: string | null;
  Stoptime: string | null;
  Distance: string | null;
  Platform: string | null;
  Route: number | null;
  Day: number | null;
};

//
//  GET  → /api/admin/trains/[trainId]
//  yahan [trainId] = TRAIN NUMBER (e.g. 10001, 12716)
//
export async function GET(
  req: Request,
  ctx: { params: { trainId: string } },
) {
  try {
    const supa = serviceClient;

    const slug = (ctx.params.trainId || "").trim();
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "invalid_train_number" },
        { status: 400 },
      );
    }

    const num = Number(slug);
    const trainNumberFilter = Number.isFinite(num) ? num : slug;

    const { data, error } = await supa
      .from("TrainRoute")
      .select("*")
      .eq("trainNumber", trainNumberFilter)
      .order("StnNumber", { ascending: true });

    if (error) {
      console.error("admin train detail error", error);
      return NextResponse.json(
        { ok: false, error: "db_error" },
        { status: 500 },
      );
    }

    const rows: TrainRouteRow[] = (data || []) as any[];
    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "train_not_found" },
        { status: 404 },
      );
    }

    const head: any = rows[0];

    return NextResponse.json({
      ok: true,
      train: {
        trainId: head.trainId ?? null,
        trainNumber: head.trainNumber ?? null,
        trainName: head.trainName ?? null,
        stationFrom: head.stationFrom ?? null,
        stationTo: head.stationTo ?? null,
        runningDays: head.runningDays ?? null,
        status: head.status ?? null,
        created_at: head.created_at ?? null,
        updated_at: head.updated_at ?? null,
      },
      route: rows,
    });
  } catch (e) {
    console.error("admin train detail server_error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}

//
//  POST  → save changes for **given trainNumber**
//
export async function POST(
  req: Request,
  ctx: { params: { trainId: string } },
) {
  try {
    const supa = serviceClient;

    const slug = (ctx.params.trainId || "").trim();
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "invalid_train_number" },
        { status: 400 },
      );
    }

    const num = Number(slug);
    const trainNumberFilter = Number.isFinite(num) ? num : slug;

    const body = await req.json().catch(() => null);
    if (!body || !body.train || !Array.isArray(body.route)) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload" },
        { status: 400 },
      );
    }

    const { train, route } = body as {
      train: {
        trainName: string | null;
        trainNumber: number | null;
        stationFrom: string | null;
        stationTo: string | null;
        runningDays: string | null;
        status?: string | null;
      };
      route: TrainRouteRow[];
    };

    // ------------ 1) COMMON FIELDS UPDATE (saari rows for this trainNumber) -------------
    const baseUpdate: any = {
      trainName: train.trainName,
      trainNumber: train.trainNumber,
      stationFrom: train.stationFrom,
      stationTo: train.stationTo,
      runningDays: train.runningDays,
    };

    let statusColumnMissing = false;

    // status ke saath try
    let { error: updErr } = await supa
      .from("TrainRoute")
      .update({
        ...baseUpdate,
        status: typeof train.status === "undefined" ? null : train.status,
      })
      .eq("trainNumber", trainNumberFilter);

    // agar "status" column hi nahi hai to bina status ke fir se
    if (updErr && updErr.message?.toLowerCase().includes("status")) {
      console.warn("TrainRoute table missing 'status' column, retrying without it.");
      statusColumnMissing = true;

      const { error: retryErr } = await supa
        .from("TrainRoute")
        .update(baseUpdate)
        .eq("trainNumber", trainNumberFilter);

      if (retryErr) {
        console.error("admin train bulk update error (retry)", retryErr);
        return NextResponse.json(
          { ok: false, error: "update_error" },
          { status: 500 },
        );
      }

      updErr = null;
    }

    if (updErr) {
      console.error("admin train bulk update error", updErr);
      return NextResponse.json(
        { ok: false, error: "update_error" },
        { status: 500 },
      );
    }

    // ------------ 2) ROUTE ROWS UPDATE (NO id, key = trainNumber + StnNumber) -------------
    for (const r of route as TrainRouteRow[]) {
      if (r.StnNumber == null) {
        // agar station number hi nahi hai to kaise identify kare — skip
        continue;
      }

      // payload banate waqt undefined → null kar dete hain
      const updateCols: any = {
        trainId: r.trainId,
        trainNumber: train.trainNumber, // ensure sab same ho
        trainName: r.trainName,
        stationFrom: r.stationFrom,
        stationTo: r.stationTo,
        runningDays: r.runningDays,
        StnNumber: r.StnNumber,
        StationCode: r.StationCode,
        StationName: r.StationName,
        Arrives: r.Arrives,
        Departs: r.Departs,
        Stoptime: r.Stoptime,
        Distance: r.Distance,
        Platform: r.Platform,
        Route: r.Route,
        Day: r.Day,
      };

      Object.keys(updateCols).forEach((k) => {
        const key = k as keyof typeof updateCols;
        if (updateCols[key] === undefined) {
          updateCols[key] = null;
        }
      });

      const { error: rowErr } = await supa
        .from("TrainRoute")
        .update(updateCols)
        .eq("trainNumber", trainNumberFilter)
        .eq("StnNumber", r.StnNumber);

      if (rowErr) {
        console.error("admin train route row update error", rowErr, r);
        return NextResponse.json(
          { ok: false, error: "route_update_error" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      warning: statusColumnMissing
        ? 'TrainRoute table me "status" column nahi mila; agar chahiye to Supabase me ek text/varchar column add kar sakte ho.'
        : null,
    });
  } catch (e) {
    console.error("admin train save server_error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
