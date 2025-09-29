import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function normalizeIncoming(value: any) {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim();
  return value;
}

function getMaybe(obj: any, ...keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (k.includes(".")) {
      const parts = k.split(".");
      let cur: any = obj;
      let ok = true;
      for (const p of parts) {
        if (cur && cur[p] !== undefined && cur[p] !== null) {
          cur = cur[p];
        } else {
          ok = false;
          break;
        }
      }
      if (ok) return cur;
    } else {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
  }
  return undefined;
}

// ---------------- GET ----------------
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) {
      return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });
    }

    let row: any = null;
    const tryColumns = ["RestroCode", "restro_code", "RestroId", "restro_id", "code"];

    for (const col of tryColumns) {
      const { data, error } = await supabaseServer
        .from("RestroMaster")
        .select("*")
        .eq(col, codeParam)
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        row = data;
        break;
      }
    }

    if (!row) {
      return NextResponse.json({ ok: false, error: "Restro not found" }, { status: 404 });
    }

    // enrich with Station details
    const stationCode = getMaybe(row, "StationCode", "station_code", "stationCode") ?? null;
    if (stationCode) {
      const { data: s, error: sErr } = await supabaseServer
        .from("Stations")
        .select("StationId,StationName,StationCode,State,station_category,station_type,StateName")
        .eq("StationCode", stationCode)
        .maybeSingle();

      if (!sErr && s) {
        row = {
          ...row,
          StationName: row.StationName ?? s.StationName,
          StationCode: row.StationCode ?? s.StationCode,
          State: row.State ?? s.State ?? s.StateName,
          StationCategory: row.StationCategory ?? s.station_category ?? s.station_type,
        };
      }
    }

    return NextResponse.json({ ok: true, row });
  } catch (err: any) {
    console.error("GET /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Server error" }, { status: 500 });
  }
}

// ---------------- PATCH ----------------
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) {
      return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // whitelist fields (without FSSAI/GST/PAN now!)
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
      "StationCode",
      "StationName",
      "State",
      "StationCategory",
      "RestroAddress",
      "City",
      "District",
      "PinCode",
      "RestroLatitude",
      "RestroLongitude",
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
    for (const k of Object.keys(body)) {
      if (allowedKeys.has(k)) {
        updates[k] = normalizeIncoming(body[k]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    let updatedRow: any = null;
    const identifiers = ["RestroCode", "restro_code", "RestroId", "restro_id", "code"];

    for (const col of identifiers) {
      const { data, error } = await supabaseServer
        .from("RestroMaster")
        .update(updates)
        .eq(col, codeParam)
        .select()
        .maybeSingle();
      if (!error && data) {
        updatedRow = data;
        break;
      }
    }

    if (!updatedRow) {
      return NextResponse.json({ ok: false, error: "Update failed or restro not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, row: updatedRow });
  } catch (err: any) {
    console.error("PATCH /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Server error" }, { status: 500 });
  }
}
