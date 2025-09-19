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
    const stationCode = row.StationCode ?? row.station_code ?? row.stationCode ?? null;
    if (stationCode) {
      try {
        const sres = await supabaseServer
          .from("Stations")
          .select("StationId,StationName,StationCode,State,station_category,station_type,StateName")
          .eq("StationCode", stationCode)
          .limit(1)
          .maybeSingle();
        if (sres.error) {
          console.warn("Station fetch warning:", sres.error);
        } else if (sres.data) {
          // Merge a few station fields onto the restro row (client expects StationName, StationCode, State, StationCategory)
          const s = sres.data;
          row = {
            ...row,
            StationName: row.StationName ?? row.station_name ?? s.StationName ?? s.station_name ?? s.name ?? row.StationName,
            StationCode: row.StationCode ?? row.station_code ?? s.StationCode ?? s.station_code ?? s.code ?? row.StationCode,
            State: row.State ?? row.state ?? row.StateName ?? s.State ?? s.state ?? s.StateName ?? row.State,
            StationCategory:
              row.StationCategory ??
              row.station_category ??
              s.station_category ??
              s.station_type ??
              row.StationCategory,
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
        updates[k] = normalizeIncoming(body[k]);
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
