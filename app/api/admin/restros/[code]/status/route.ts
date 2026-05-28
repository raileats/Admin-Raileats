export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function toStatusNumber(value: any) {
  const normalized = String(value ?? "").toLowerCase().trim();

  if (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "on" ||
    normalized === "active"
  ) {
    return 1;
  }

  if (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "off" ||
    normalized === "inactive" ||
    normalized === "deactive" ||
    normalized === "deactivate"
  ) {
    return 0;
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  return NextResponse.json({
    ok: true,
    message: "API working",
    code: params.code,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = Number(params.code);

    if (!restroCode || Number.isNaN(restroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid restro code" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const supabase = srv();
    const updateData: any = {};

    if (body.commit !== "save") {
      const { data: currentRow } = await supabase
        .from("RestroMaster")
        .select("RestroCode,RaileatsStatus,updated_at")
        .eq("RestroCode", restroCode)
        .maybeSingle();

      return NextResponse.json(
        {
          ok: true,
          ignored: true,
          message: "RaileatsStatus update ignored until Save button is clicked",
          row: currentRow,
        },
        { status: 200 }
      );
    }

    const setIfDefined = (key: string, value: any) => {
      if (value !== undefined) updateData[key] = value;
    };

    setIfDefined("RestroName", body.RestroName);
    setIfDefined("OwnerName", body.OwnerName);
    setIfDefined("OwnerEmail", body.OwnerEmail);
    setIfDefined("OwnerPhone", body.OwnerPhone);
    setIfDefined("RestroEmail", body.RestroEmail);
    setIfDefined("RestroPhone", body.RestroPhone);

    setIfDefined("RestroAddress", body.RestroAddress);
    setIfDefined("City", body.City);
    setIfDefined("State", body.State);
    setIfDefined("District", body.District);
    setIfDefined("PinCode", body.PinCode);
    setIfDefined("RestroLatitude", body.RestroLatitude);
    setIfDefined("RestroLongitude", body.RestroLongitude);

    setIfDefined("IsIrctcApproved", body.IsIrctcApproved);

    const incomingRaileatsStatus =
      body.RaileatsStatus !== undefined ? body.RaileatsStatus : body.raileatsStatus;

    if (incomingRaileatsStatus !== undefined) {
      const normalizedStatus = toStatusNumber(incomingRaileatsStatus);

      if (normalizedStatus === null) {
        return NextResponse.json(
          { ok: false, error: "Invalid RaileatsStatus value" },
          { status: 400 }
        );
      }

      updateData.RaileatsStatus = normalizedStatus;
    }

    setIfDefined("WeeklyOff", body.WeeklyOff);
    setIfDefined("MinimumOrderValue", body.MinimumOrderValue);
    setIfDefined("CutOffTime", body.CutOffTime);

    setIfDefined("open_time", body.open_time);
    setIfDefined("closed_time", body.closed_time);

    setIfDefined(
      "RaileatsCustomerDeliveryCharge",
      body.RaileatsCustomerDeliveryCharge
    );
    setIfDefined(
      "RaileatsCustomerDeliveryChargeGSTRate",
      body.RaileatsCustomerDeliveryChargeGSTRate
    );
    setIfDefined(
      "RaileatsCustomerDeliveryChargeGST",
      body.RaileatsCustomerDeliveryChargeGST
    );
    setIfDefined(
      "RaileatsCustomerDeliveryChargeTotalInclGST",
      body.RaileatsCustomerDeliveryChargeTotalInclGST
    );

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(updateData)
      .eq("RestroCode", restroCode)
      .select("RestroCode,RaileatsStatus,updated_at");

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No row updated (check RestroCode)" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      row: data[0],
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
