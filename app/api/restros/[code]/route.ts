export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function num(value: any) {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function text(value: any) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const cleaned = String(value).trim();
  return cleaned === "" ? null : cleaned;
}

function setIfDefined(payload: Record<string, any>, key: string, value: any) {
  if (value !== undefined) payload[key] = value;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const RestroCode = Number(params.code);

    if (!RestroCode || Number.isNaN(RestroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .select("*")
      .eq("RestroCode", RestroCode)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const RestroCode = Number(params.code);

    if (!RestroCode || Number.isNaN(RestroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const payload: Record<string, any> = {};

    setIfDefined(payload, "StationCode", text(body.StationCode));
    setIfDefined(payload, "StationName", text(body.StationName));
    setIfDefined(payload, "State", text(body.State));

    setIfDefined(payload, "RestroName", text(body.RestroName));
    setIfDefined(payload, "OwnerName", text(body.OwnerName));
    setIfDefined(payload, "OwnerEmail", text(body.OwnerEmail));
    setIfDefined(payload, "OwnerPhone", text(body.OwnerPhone));
    setIfDefined(payload, "RestroEmail", text(body.RestroEmail));
    setIfDefined(payload, "RestroPhone", text(body.RestroPhone));
    setIfDefined(payload, "BrandNameifAny", text(body.BrandNameifAny));

    setIfDefined(payload, "IRCTCStatus", num(body.IRCTCStatus));
    setIfDefined(payload, "RaileatsStatus", num(body.RaileatsStatus));
    setIfDefined(payload, "IsIrctcApproved", body.IsIrctcApproved);
    setIfDefined(payload, "RestroRating", num(body.RestroRating));
    setIfDefined(payload, "IsPureVeg", num(body.IsPureVeg));

    // Important: keep the exact path/URL typed by admin. Do not auto-clean it.
    setIfDefined(payload, "RestroDisplayPhoto", text(body.RestroDisplayPhoto));

    setIfDefined(payload, "open_time", text(body.open_time));
    setIfDefined(payload, "closed_time", text(body.closed_time));
    setIfDefined(payload, "MinimumOrderValue", num(body.MinimumOrderValue));
    setIfDefined(payload, "CutOffTime", num(body.CutOffTime));
    setIfDefined(payload, "WeeklyOff", text(body.WeeklyOff));
    setIfDefined(payload, "RaileatsCustomerDeliveryCharge", num(body.RaileatsCustomerDeliveryCharge));
    setIfDefined(payload, "RaileatsCustomerDeliveryChargeGSTRate", num(body.RaileatsCustomerDeliveryChargeGSTRate));
    setIfDefined(payload, "RaileatsCustomerDeliveryChargeGST", num(body.RaileatsCustomerDeliveryChargeGST));
    setIfDefined(payload, "RaileatsCustomerDeliveryChargeTotalInclGST", num(body.RaileatsCustomerDeliveryChargeTotalInclGST));
    setIfDefined(payload, "RaileatsOrdersPaymentOptionforCustomer", text(body.RaileatsOrdersPaymentOptionforCustomer));
    setIfDefined(payload, "IRCTCOrdersPaymentOptionforCustomer", text(body.IRCTCOrdersPaymentOptionforCustomer));
    setIfDefined(payload, "RestroTypeofDeliveryRailEatsorVendor", text(body.RestroTypeofDeliveryRailEatsorVendor));

    setIfDefined(payload, "RestroLoginMobile", text(body.RestroLoginMobile));
    setIfDefined(payload, "RestroPassword", text(body.RestroPassword));
    setIfDefined(payload, "HolidayStatus", num(body.HolidayStatus));
    setIfDefined(payload, "MinimumOrderAmount", num(body.MinimumOrderAmount));

    payload.UpdatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", RestroCode)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
