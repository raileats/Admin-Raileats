// path: app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Helper: normalizes empty string -> null, trims strings
 */
function normalizeIncoming(value: any) {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim();
  return value;
}

/**
 * Safe getter that accepts multiple candidate keys and returns the first non-null value.
 */
function getMaybe(obj: any, ...keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (k.includes(".")) {
      const parts = k.split(".");
      let cur: any = obj;
      let ok = true;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p) && cur[p] !== undefined && cur[p] !== null) {
          cur = cur[p];
        } else {
          ok = false;
          break;
        }
      }
      if (ok) return cur;
    } else {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
      const v = (obj as any)[k];
      if (v !== undefined && v !== null) return v;
    }
  }
  return undefined;
}

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });

    const tryColumns = [
      { col: "RestroCode", val: codeParam },
      { col: "restro_code", val: codeParam },
      { col: "RestroId", val: codeParam },
      { col: "restro_id", val: codeParam },
      { col: "code", val: codeParam },
    ];

    let row: any = null;
    for (const t of tryColumns) {
      const { data, error } = await supabaseServer
        .from("RestroMaster")
        .select("*")
        .eq(t.col, t.val)
        .limit(1)
        .maybeSingle();
      if (error) console.warn("Supabase lookup warning for", t.col, error.message ?? error);
      if (data) { row = data; break; }
    }

    if (!row) {
      const { data, error } = await supabaseServer
        .from("RestroMaster")
        .select("*")
        .or(`RestroCode.eq.${codeParam},restro_code.eq.${codeParam}`)
        .limit(1)
        .maybeSingle();
      if (!error && data) row = data;
    }

    if (!row) return NextResponse.json({ ok: false, error: "Restro not found" }, { status: 404 });

    const stationCode = getMaybe(row, "StationCode", "station_code", "stationCode", "station?.code") ?? null;
    if (stationCode) {
      try {
        const sres = await supabaseServer
          .from("Stations")
          .select("StationId,StationName,StationCode,State,station_category,station_type,StateName")
          .eq("StationCode", stationCode)
          .limit(1)
          .maybeSingle();
        if (!sres.error && sres.data) {
          const s: any = sres.data;
          const mergedStationName =
            getMaybe(row, "StationName", "station_name") ?? getMaybe(s, "StationName", "station_name", "name");
          const mergedStationCode =
            getMaybe(row, "StationCode", "station_code") ?? getMaybe(s, "StationCode", "station_code", "code");
          const mergedState =
            getMaybe(row, "State", "state", "StateName") ?? getMaybe(s, "State", "state", "StateName");
          const mergedCategory =
            getMaybe(row, "StationCategory", "station_category") ?? getMaybe(s, "station_category", "station_type", "category");

          row = {
            ...row,
            StationName: mergedStationName ?? null,
            StationCode: mergedStationCode ?? null,
            State: mergedState ?? null,
            StationCategory: mergedCategory ?? null,
          };
        }
      } catch (err) {
        console.warn("Error fetching station record:", err);
      }
    }

    return NextResponse.json({ ok: true, row });
  } catch (err: any) {
    console.error("GET /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const allowedKeys = new Set([
      "RestroName","RestroEmail","RestroPhone","OwnerName","OwnerEmail","OwnerPhone",
      "BrandName","RestroDisplayPhoto","RestroRating","FSSAINumber","FSSAIExpiryDate",
      "StationCode","StationName","State","StationCategory","WeeklyOff","OpenTime","ClosedTime",
      "MinimumOrderValue","CutOffTime","RaileatsDeliveryCharge","RaileatsDeliveryChargeGSTRate",
      "RaileatsDeliveryChargeGST","RaileatsDeliveryChargeTotalInclGST","OrdersPaymentOptionForCustomer",
      "IRCTCOrdersPaymentOptionForCustomer","RestroTypeOfDelivery","IRCTC","Raileats","IsIrctcApproved",
      // plus any extra keys you want to allow
    ]);

    const updates: Record<string, any> = {};
    for (const k of Object.keys(body || {})) {
      if (allowedKeys.has(k)) updates[k] = normalizeIncoming((body as any)[k]);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    const identifiers = [
      { col: "RestroCode", val: codeParam },
      { col: "restro_code", val: codeParam },
      { col: "RestroId", val: codeParam },
      { col: "restro_id", val: codeParam },
      { col: "code", val: codeParam },
    ];

    let updateRes: any = null;
    for (const id of identifiers) {
      const attempt = await supabaseServer.from("RestroMaster").update(updates).eq(id.col, id.val).select().maybeSingle();
      if (!attempt.error && attempt.data) { updateRes = attempt; break; }
    }

    if (!updateRes) {
      const attempt = await supabaseServer.from("RestroMaster").update(updates).eq("RestroCode", codeParam).select().maybeSingle();
      if (!attempt.error && attempt.data) updateRes = attempt;
    }

    if (!updateRes) return NextResponse.json({ ok: false, error: "Update failed or restro not found" }, { status: 404 });

    return NextResponse.json({ ok: true, row: updateRes.data ?? null });
  } catch (err: any) {
    console.error("PATCH /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
