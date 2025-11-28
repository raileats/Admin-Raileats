// app/api/admin/trains/[trainId]/route.ts
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
      .select("*")
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

    const head: any = rows[0];

    return NextResponse.json({
      ok: true,
      train: {
        trainId: head.trainId,
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

// 💾 Save changes
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

    // 1) update common train fields for all rows with this trainId
    const baseUpdate: any = {
      trainName: train.trainName,
      trainNumber: train.trainNumber,
      stationFrom: train.stationFrom,
      stationTo: train.stationTo,
      runningDays: train.runningDays,
    };

    // status ko optional rakhenge (column ho bhi sakta hai, nahi bhi)
    if (typeof train.status !== "undefined") {
      baseUpdate.status = train.status;
    }

    let { error: updErr } = await supa
      .from("TrainRoute")
      .update(baseUpdate)
      .eq("trainId", trainIdNum);

    // agar status column missing hua to retry bina status ke,
    // aur user ko clear message bhejna.
    if (updErr && updErr.message?.includes('column "status"')) {
      console.warn("TrainRoute table missing 'status' column.");
      const { status, ...withoutStatus } = baseUpdate;
      const retry = await supa
        .from("TrainRoute")
        .update(withoutStatus)
        .eq("trainId", trainIdNum);

      if (retry.error) {
        console.error("admin train bulk update error (retry)", retry.error);
        return NextResponse.json(
          {
            ok: false,
            error:
              'Supabase column missing: please add a "status" text/varchar column in TrainRoute table.',
          },
          { status: 500 },
        );
      }
      // retry success – but bata diya column add karna hai
      updErr = null;
    }

    if (updErr) {
      console.error("admin train bulk update error", updErr);
      return NextResponse.json(
        { ok: false, error: "update_error" },
        { status: 500 },
      );
    }

    // 2) each route row ko update karo (per-row update, upsert nahi)
    for (const r of route as TrainRouteRow[]) {
      const { id, ...updateCols } = {
        ...r,
        trainId: trainIdNum,
      };

      // undefined ko null bana do
      Object.keys(updateCols).forEach((k) => {
        const key = k as keyof typeof updateCols;
        if (updateCols[key] === undefined) {
          (updateCols as any)[key] = null;
        }
      });

      let routeErr;

      if (id != null) {
        // id hai to id se update
        const { error } = await supa
          .from("TrainRoute")
          .update(updateCols)
          .eq("id", id);
        routeErr = error;
      } else {
        // id nahi hai to trainId + StnNumber se update
        let query = supa
          .from("TrainRoute")
          .update(updateCols)
          .eq("trainId", trainIdNum);

        if (r.StnNumber != null) {
          query = query.eq("StnNumber", r.StnNumber);
        }

        const { error } = await query;
        routeErr = error;
      }

      if (routeErr) {
        console.error("admin train route row update error", routeErr, r);
        return NextResponse.json(
          { ok: false, error: "route_update_error" },
          { status: 500 },
        );
      }
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
