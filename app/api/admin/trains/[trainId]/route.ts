import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";


type TrainRouteRow = {
  id?: number; // agar table me PK ho to
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

export async function GET(
  req: Request,
  ctx: { params: { trainId: string } },
) {
  try {
    const supa = serviceClient;
    const trainIdNum = Number(ctx.params.trainId);

    if (!Number.isFinite(trainIdNum)) {
      return NextResponse.json(
        { ok: false, error: "invalid_train_id" },
        { status: 400 },
      );
    }

    const { data, error } = await supa
      .from("TrainRoute")
      .select(
        "trainId, trainNumber, trainName, stationFrom, stationTo, runningDays, StnNumber, StationCode, StationName, Arrives, Departs, Stoptime, Distance, Platform, Route, Day, status, created_at, updated_at, id",
      )
      .eq("trainId", trainIdNum)
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

    const head = rows[0];

    return NextResponse.json({
      ok: true,
      train: {
        trainId: head.trainId,
        trainNumber: head.trainNumber,
        trainName: head.trainName,
        stationFrom: head.stationFrom,
        stationTo: head.stationTo,
        runningDays: head.runningDays,
        status: (head as any).status ?? null,
        created_at: (head as any).created_at ?? null,
        updated_at: (head as any).updated_at ?? null,
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

// 💾 Save back changes (basic example – full replace by trainId)
export async function POST(
  req: Request,
  ctx: { params: { trainId: string } },
) {
  try {
    const supa = serviceClient;
    const trainIdNum = Number(ctx.params.trainId);
    if (!Number.isFinite(trainIdNum)) {
      return NextResponse.json(
        { ok: false, error: "invalid_train_id" },
        { status: 400 },
      );
    }

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

    // 1) Update common fields for this trainId (all rows)
    const updatePayload: any = {
      trainName: train.trainName,
      trainNumber: train.trainNumber,
      stationFrom: train.stationFrom,
      stationTo: train.stationTo,
      runningDays: train.runningDays,
    };
    if (train.status !== undefined) {
      updatePayload.status = train.status;
    }

    const { error: updErr } = await supa
      .from("TrainRoute")
      .update(updatePayload)
      .eq("trainId", trainIdNum);

    if (updErr) {
      console.error("admin train bulk update error", updErr);
      return NextResponse.json(
        { ok: false, error: "update_error" },
        { status: 500 },
      );
    }

    // 2) Upsert each route row (by id if available, else by trainId+StnNumber)
    const cleanedRoutes = route.map((r) => ({
      id: r.id ?? undefined,
      trainId: trainIdNum,
      trainNumber: r.trainNumber,
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
    }));

    const { error: routeErr } = await supa
      .from("TrainRoute")
      .upsert(cleanedRoutes, {
        onConflict: "id", // agar tumhaare table me alag PK ho to yahan change karna
      });

    if (routeErr) {
      console.error("admin train route upsert error", routeErr);
      return NextResponse.json(
        { ok: false, error: "route_update_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin train save server_error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
