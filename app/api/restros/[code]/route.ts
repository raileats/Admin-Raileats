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

function phone(value: any) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const digits = String(value).replace(/\D/g, "").slice(0, 10);
  return digits || null;
}

function firstDefined(...values: any[]) {
  return values.find((value) => value !== undefined);
}

function setIfDefined(payload: Record<string, any>, key: string, value: any) {
  if (value !== undefined) payload[key] = value;
}

function sameText(saved: any, expected: any) {
  const savedText = saved === null || saved === undefined ? "" : String(saved).trim();
  const expectedText = expected === null || expected === undefined ? "" : String(expected).trim();
  return savedText === expectedText;
}

function sameNumber(saved: any, expected: any) {
  if (saved === null || saved === undefined || saved === "") {
    return expected === null || expected === undefined || expected === "";
  }

  if (expected === null || expected === undefined || expected === "") {
    return saved === null || saved === undefined || saved === "";
  }

  const savedNumber = Number(saved);
  const expectedNumber = Number(expected);

  if (!Number.isFinite(savedNumber) || !Number.isFinite(expectedNumber)) {
    return String(saved).trim() === String(expected).trim();
  }

  return Math.abs(savedNumber - expectedNumber) < 0.000001;
}

async function updateRestro(restroCode: number, payload: Record<string, any>) {
  const { data, error } = await supabase
    .from("RestroMaster")
    .update(payload)
    .eq("RestroCode", restroCode)
    .select("*")
    .single();

  if (!error) return { data, error };

  const missingColumn = /column .* does not exist/i.test(error.message || "");
  if (!missingColumn) return { data, error };

  // Some deployments do not yet have optional login alias columns.
  // Retry with the core RestroMaster columns so normal saves never break.
  const optionalKeys = [
    "RestroUserName",
    "RestroUsername",
    "UserName",
    "Password",
  ];

  const safePayload = { ...payload };
  optionalKeys.forEach((key) => delete safePayload[key]);

  return supabase
    .from("RestroMaster")
    .update(safePayload)
    .eq("RestroCode", restroCode)
    .select("*")
    .single();
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
    setIfDefined(payload, "RestroAddress", text(body.RestroAddress));
    setIfDefined(payload, "City", text(body.City));
    setIfDefined(payload, "District", text(body.District));
    setIfDefined(payload, "PinCode", text(body.PinCode));
    setIfDefined(payload, "RestroLatitude", num(body.RestroLatitude ?? body.Latitude));
    setIfDefined(payload, "RestroLongitude", num(body.RestroLongitude ?? body.Longitude));

    setIfDefined(payload, "RestroName", text(body.RestroName));
    setIfDefined(payload, "OwnerName", text(body.OwnerName));
    setIfDefined(payload, "OwnerEmail", text(body.OwnerEmail));
    setIfDefined(payload, "OwnerPhone", phone(body.OwnerPhone));
    setIfDefined(payload, "RestroEmail", text(body.RestroEmail));
    setIfDefined(
      payload,
      "RestroPhone",
      phone(
        firstDefined(
          body.RestroPhone,
          body.restroPhone,
          body.RestroMobile,
          body.RestaurantPhone,
          body.Phone
        )
      )
    );
    setIfDefined(payload, "BrandNameifAny", text(body.BrandNameifAny));

    setIfDefined(payload, "IRCTCStatus", num(body.IRCTCStatus));
    setIfDefined(payload, "RaileatsStatus", num(body.RaileatsStatus));
    setIfDefined(payload, "IsIrctcApproved", body.IsIrctcApproved);
    setIfDefined(payload, "RestroRating", num(body.RestroRating));
    setIfDefined(payload, "IsPureVeg", num(body.IsPureVeg));

    // Important: keep the exact path/URL typed by admin. Do not auto-clean it.
    setIfDefined(payload, "RestroDisplayPhoto", text(body.RestroDisplayPhoto));

    setIfDefined(payload, "open_time", text(body.open_time ?? body.OpenTime));
    setIfDefined(payload, "closed_time", text(body.closed_time ?? body.ClosedTime));
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
    setIfDefined(payload, "RestroUserName", text(body.RestroUserName));
    setIfDefined(payload, "RestroUsername", text(body.RestroUsername));
    setIfDefined(payload, "UserName", text(body.UserName));
    setIfDefined(payload, "RestroPassword", text(body.RestroPassword));
    setIfDefined(payload, "Password", text(body.Password));
    setIfDefined(payload, "HolidayStatus", num(body.HolidayStatus));
    setIfDefined(payload, "MinimumOrderAmount", num(body.MinimumOrderAmount));

    payload.UpdatedAt = new Date().toISOString();

    const expectedRestroPhone = phone(
      firstDefined(
        body.RestroPhone,
        body.restroPhone,
        body.RestroMobile,
        body.RestaurantPhone,
        body.Phone
      )
    );
    const expectedDeliveryGst = num(body.RaileatsCustomerDeliveryChargeGST);

    const { data, error } = await updateRestro(RestroCode, payload);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: freshRow, error: freshError } = await supabase
      .from("RestroMaster")
      .select("*")
      .eq("RestroCode", RestroCode)
      .single();

    if (freshError) {
      return NextResponse.json(
        { ok: false, error: freshError.message },
        { status: 500 }
      );
    }

    const verifyErrors: string[] = [];

    if (
      expectedRestroPhone !== undefined &&
      !sameText(freshRow?.RestroPhone, expectedRestroPhone)
    ) {
      const { data: phoneRetryRow, error: phoneRetryError } = await supabase
        .from("RestroMaster")
        .update({ RestroPhone: expectedRestroPhone, UpdatedAt: new Date().toISOString() })
        .eq("RestroCode", RestroCode)
        .select("*")
        .single();

      if (
        phoneRetryError ||
        !sameText(phoneRetryRow?.RestroPhone, expectedRestroPhone)
      ) {
        verifyErrors.push(
          `RestroPhone save verify failed. Expected ${expectedRestroPhone ?? "blank"}, got ${phoneRetryRow?.RestroPhone ?? freshRow?.RestroPhone ?? "blank"}`
        );
      } else {
        Object.assign(freshRow, phoneRetryRow);
      }
    }

    if (
      body.RaileatsCustomerDeliveryChargeGST !== undefined &&
      !sameNumber(freshRow?.RaileatsCustomerDeliveryChargeGST, expectedDeliveryGst)
    ) {
      verifyErrors.push(
        `RaileatsCustomerDeliveryChargeGST save verify failed. Expected ${expectedDeliveryGst ?? "blank"}, got ${freshRow?.RaileatsCustomerDeliveryChargeGST ?? "blank"}`
      );
    }

    if (verifyErrors.length > 0) {
      return NextResponse.json(
        { ok: false, error: verifyErrors.join(" | "), row: freshRow },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: freshRow ?? data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
