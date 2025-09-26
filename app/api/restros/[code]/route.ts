// app/api/restros/[code]/route.ts
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
 * Uses bracket-access so TypeScript does not complain about property names that aren't declared.
 */
function getMaybe(obj: any, ...keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (k.includes(".")) {
      // support simple dot path like "station.name"
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
      // try bracket access too (covers cases where obj is typed differently)
      const v = (obj as any)[k];
      if (v !== undefined && v !== null) return v;
    }
  }
  return undefined;
}

/**
 * GET handler - fetch a single restro by code (RestroCode / restro_code / RestroId ...)
 * Also attempts to enrich with station details from Stations table if StationCode present.
 */
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });

    // Try looking up by multiple possible columns
    const tryColumns = [
      { col: "RestroCode", val: codeParam },
      { col: "restro_code", val: codeParam },
      { col: "RestroId", val: codeParam },
      { col: "restro_id", val: codeParam },
      { col: "code", val: codeParam },
    ];

    // Attempt queries until we find a row
    let row: any = null;
    for (const t of tryColumns) {
      const { data, error } = await supabaseServer
        .from("RestroMaster")
        .select("*")
        .eq(t.col, t.val)
        .limit(1)
        .maybeSingle();

      if (error) {
        // ignore and continue tries, but log
        console.warn("Supabase lookup warning for", t.col, error.message ?? error);
      }
      if (data) {
        row = data;
        break;
      }
    }

    // fallback: try searching with RestroCode cast as integer vs string etc
    if (!row) {
      const { data, error } = await supabaseServer
        .from("RestroMaster")
        .select("*")
        .or(`RestroCode.eq.${codeParam},restro_code.eq.${codeParam}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) row = data;
    }

    if (!row) {
      return NextResponse.json({ ok: false, error: "Restro not found" }, { status: 404 });
    }

    // If the Restro row has StationCode (or station_code), try fetching Station details to enrich the response
    const stationCode = getMaybe(row, "StationCode", "station_code", "stationCode", "station?.code", "station.code") ?? null;
    if (stationCode) {
      try {
        // Select a few common fields - the actual DB may return them in different casing.
        const sres = await supabaseServer
          .from("Stations")
          .select("StationId,StationName,StationCode,State,station_category,station_type,StateName")
          .eq("StationCode", stationCode)
          .limit(1)
          .maybeSingle();

        if (sres.error) {
          console.warn("Station fetch warning:", sres.error);
        } else if (sres.data) {
          const s: any = sres.data;

          // Use getMaybe to find whichever of the candidate fields exist.
          const mergedStationName =
            getMaybe(row, "StationName", "station_name", "station", "station?.name") ??
            getMaybe(s, "StationName", "station_name", "name");
          const mergedStationCode =
            getMaybe(row, "StationCode", "station_code", "stationCode") ??
            getMaybe(s, "StationCode", "station_code", "code");
          const mergedState =
            getMaybe(row, "State", "state", "StateName") ??
            getMaybe(s, "State", "state", "StateName");
          const mergedCategory =
            getMaybe(row, "StationCategory", "station_category", "stationType", "Station_Type", "Category") ??
            getMaybe(s, "station_category", "station_type", "category", "type");

          row = {
            ...row,
            StationName: mergedStationName ?? (row.StationName ?? (row as any)["station_name"] ?? (s as any).StationName ?? (s as any)["station_name"] ?? (s as any).name ?? null),
            StationCode: mergedStationCode ?? (row.StationCode ?? (row as any)["station_code"] ?? (s as any).StationCode ?? (s as any)["station_code"] ?? (s as any).code ?? null),
            State: mergedState ?? (row.State ?? (row as any).state ?? (row as any).StateName ?? (s as any).State ?? (s as any).state ?? (s as any).StateName ?? null),
            StationCategory:
              mergedCategory ??
              (row.StationCategory ?? (row as any).station_category ?? (s as any).station_category ?? (s as any).station_type ?? (s as any).type ?? null),
            // keep all other fields as-is
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

/**
 * PATCH handler - update restro columns
 * This is adapted from your existing code and keeps the same behavior.
 */
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    // Only allow keys that you accept (simple whitelist)
    const allowedKeys = new Set([
      "RestroName",
      "RestroEmail",
      "RestroPhone",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "BrandName",
      "RestroDisplayPhoto",
      "RestroRating",
      "FSSAINumber",
      "FSSAIExpiryDate",
      "StationCode",
      "StationName",
      "State",
      "StationCategory",
      "WeeklyOff",
      "OpenTime",
      "ClosedTime",
      "MinimumOrderValue",
      "CutOffTime",
      "RaileatsDeliveryCharge",
      "RaileatsDeliveryChargeGSTRate",
      "RaileatsDeliveryChargeGST",
      "RaileatsDeliveryChargeTotalInclGST",
      "OrdersPaymentOptionForCustomer",
      "IRCTCOrdersPaymentOptionForCustomer",
      "RestroTypeOfDelivery",
      "IRCTC",
      "Raileats",
      "IsIrctcApproved",
    ]);

    const updates: Record<string, any> = {};
    for (const k of Object.keys(body || {})) {
      if (allowedKeys.has(k)) {
        updates[k] = normalizeIncoming((body as any)[k]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    // Determine identifier column - prefer RestroCode column match
    const identifiers = [
      { col: "RestroCode", val: codeParam },
      { col: "restro_code", val: codeParam },
      { col: "RestroId", val: codeParam },
      { col: "restro_id", val: codeParam },
      { col: "code", val: codeParam },
    ];

    let updateRes: any = null;
    for (const id of identifiers) {
      // attempt update
      const attempt = await supabaseServer.from("RestroMaster").update(updates).eq(id.col, id.val).select().maybeSingle();
      if (!attempt.error && attempt.data) {
        updateRes = attempt;
        break;
      }
      // if error that is fatal (not found), just continue trying other columns
    }

    if (!updateRes) {
      // final attempt: try updating by RestroCode as string
      const attempt = await supabaseServer.from("RestroMaster").update(updates).eq("RestroCode", codeParam).select().maybeSingle();
      if (!attempt.error && attempt.data) updateRes = attempt;
    }

    if (!updateRes) {
      return NextResponse.json({ ok: false, error: "Update failed or restro not found" }, { status: 404 });
    }

    const updatedRow = updateRes.data ?? null;
    return NextResponse.json({ ok: true, row: updatedRow });
  } catch (err: any) {
    console.error("PATCH /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
