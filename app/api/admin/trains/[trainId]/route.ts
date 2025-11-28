import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";

type TrainRouteRow = {
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
//  Yaha [trainId] actually TRAIN NUMBER hoga (e.g. 10001, 12716)
//
export async function GET(
  req: Request,
  ctx: { params: { trainId: string } },
) {
  try {
    const supa = serviceClient;

    const slug = (ctx.params.trainId || "").trim(); // URL ka part
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "invalid_train_number" },
        { status: 400 },
      );
    }

    // slug ko number ya string jaisa bhi ho, usi tarah filter ke liye use karenge
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

    // 1) Common fields update → saari rows jinke trainNumber = slug
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
      .eq("trainNumber", trainNumberFilter);

    if (updErr) {
      console.error("admin train bulk update error", updErr);
      return NextResponse.json(
        { ok: false, error: "update_error" },
        { status: 500 },
      );
    }

    // 2) Route rows upsert (id ke basis pe)
    const cleanedRoutes = route.map((r) => ({
      id: r.id ?? undefined,
      trainId: r.trainId,
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
        onConflict: "id",
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
