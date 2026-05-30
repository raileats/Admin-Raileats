export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function phoneText(value: any) {
  if (value === undefined) return undefined;
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);
  return digits === "" ? null : digits;
}

function setIfDefined(payload: Record<string, any>, key: string, value: any) {
  if (value !== undefined) payload[key] = value;
}

function noCacheJson(body: any, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...(init || {}),
    headers: {
      ...(init?.headers || {}),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function updateRestro(restroCode: number, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from("RestroMaster")
    .update(payload)
    .eq("RestroCode", restroCode)
    .select("*")
    .maybeSingle();

  if (!error) return { data, error };

  const missingColumn = /column .* does not exist/i.test(error.message || "");
  if (!missingColumn) return { data, error };

  const safePayload = { ...payload };

  ["RestroUserName", "RestroUsername", "UserName", "Password"].forEach((key) => {
    delete safePayload[key];
  });

  return supabase
    .from("RestroMaster")
    .update(safePayload)
    .eq("RestroCode", restroCode)
    .select("*")
    .maybeSingle();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const RestroCode = Number(params.code);

    if (!RestroCode || Number.isNaN(RestroCode)) {
      return noCacheJson(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .select("*")
      .eq("RestroCode", RestroCode)
      .maybeSingle();

    if (error) {
      return noCacheJson(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return noCacheJson({
      ok: true,
      row: {
        ...(data ?? {}),
        RestroPhone:
          data?.RestroPhone === null || data?.RestroPhone === undefined
            ? ""
            : String(data.RestroPhone),
        OwnerPhone:
          data?.OwnerPhone === null || data?.OwnerPhone === undefined
            ? ""
            : String(data.OwnerPhone),
      },
    });
  } catch (error: any) {
    return noCacheJson(
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
      return noCacheJson(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const payload: Record<string, any> = {};

    setIfDefined(payload, "StationCode", text(body.StationCode));
    setIfDefined(payload, "StationName", text(body.StationName));
    setIfDefined(payload, "State", text(body.State));
    setIfDefined(payload, "RestroAddress", text(body.RestroAddress));
    setIfDefined(payload, "City", text(body.City));
    setIfDefined(payload, "District", text(body.District));
    setIfDefined(payload, "PinCode", text(body.PinCode));

    setIfDefined(payload, "RestroLatitude", num(body.RestroLatitude ?? body.Latitude));
    setIfDefined(payload, "RestroLongitude", num(body.RestroLongitude ?? body.Longitude));

    setIfDefined(payload, "RestroName", text(body.RestroName));
    setIfDefined(payload, "OwnerName", text(body.OwnerName));
    setIfDefined(payload, "OwnerEmail", text(body.OwnerEmail));
    setIfDefined(payload, "OwnerPhone", phoneText(body.OwnerPhone));
    setIfDefined(payload, "RestroEmail", text(body.RestroEmail));
    setIfDefined(payload, "RestroPhone", phoneText(body.RestroPhone));
    setIfDefined(payload, "BrandNameifAny", text(body.BrandNameifAny));

    setIfDefined(payload, "IRCTCStatus", num(body.IRCTCStatus));
    setIfDefined(payload, "RaileatsStatus", num(body.RaileatsStatus));
    setIfDefined(payload, "IsIrctcApproved", body.IsIrctcApproved);
    setIfDefined(payload, "RestroRating", num(body.RestroRating));
    setIfDefined(payload, "IsPureVeg", num(body.IsPureVeg));
    setIfDefined(payload, "RestroDisplayPhoto", text(body.RestroDisplayPhoto));

    setIfDefined(payload, "open_time", text(body.open_time ?? body.OpenTime));
    setIfDefined(payload, "closed_time", text(body.closed_time ?? body.ClosedTime));
    setIfDefined(payload, "MinimumOrderValue", num(body.MinimumOrderValue));
    setIfDefined(payload, "MinimumOrderAmount", num(body.MinimumOrderAmount));
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
    setIfDefined(payload, "RestroUserName", text(body.RestroUserName));
    setIfDefined(payload, "RestroUsername", text(body.RestroUsername));
    setIfDefined(payload, "UserName", text(body.UserName));
    setIfDefined(payload, "RestroPassword", text(body.RestroPassword));
    setIfDefined(payload, "Password", text(body.Password));
    setIfDefined(payload, "HolidayStatus", num(body.HolidayStatus));

    payload.UpdatedAt = new Date().toISOString();

    const { data, error } = await updateRestro(RestroCode, payload);

    if (error) {
      return noCacheJson(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return noCacheJson({
      ok: true,
      row: {
        ...(data ?? {}),
        RestroPhone:
          data?.RestroPhone ??
          payload.RestroPhone ??
          phoneText(body.RestroPhone) ??
          "",
        OwnerPhone:
          data?.OwnerPhone ??
          payload.OwnerPhone ??
          phoneText(body.OwnerPhone) ??
          "",
      },
    });
  } catch (error: any) {
    return noCacheJson(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
