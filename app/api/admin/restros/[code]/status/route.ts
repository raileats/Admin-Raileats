export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ================================
   SUPABASE CLIENT
================================ */
function srv() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/* ================================
   GET (TEST PURPOSE ONLY)
================================ */
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

/* ================================
   UPDATE API (PATCH)
================================ */
export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    console.log("===== PATCH START =====");

    const restroCode = Number(params.code);

    if (!restroCode || isNaN(restroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid restro code" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("Incoming Body:", body);

    const supabase = srv();

    /* ================================
       SAFE PAYLOAD BUILDER
    ================================= */
    const updateData: any = {};

    const setIfDefined = (key: string, value: any) => {
      if (value !== undefined) updateData[key] = value;
    };

    /* ================================
       BASIC INFO
    ================================= */
    setIfDefined("RestroName", body.RestroName);
    setIfDefined("OwnerName", body.OwnerName);
    setIfDefined("OwnerEmail", body.OwnerEmail);
    setIfDefined("OwnerPhone", body.OwnerPhone);
    setIfDefined("RestroEmail", body.RestroEmail);
    setIfDefined("RestroPhone", body.RestroPhone);

    /* ================================
       ADDRESS
    ================================= */
    setIfDefined("RestroAddress", body.RestroAddress);
    setIfDefined("City", body.City);
    setIfDefined("State", body.State);
    setIfDefined("District", body.District);
    setIfDefined("PinCode", body.PinCode);
    setIfDefined("RestroLatitude", body.RestroLatitude);
    setIfDefined("RestroLongitude", body.RestroLongitude);

    /* ================================
       STATUS
    ================================= */
    setIfDefined("IsIrctcApproved", body.IsIrctcApproved);
    setIfDefined("RaileatsStatus", body.RaileatsStatus);

    /* ================================
       SETTINGS
    ================================= */
    setIfDefined("WeeklyOff", body.WeeklyOff);
    setIfDefined("MinimumOrderValue", body.MinimumOrderValue);
    setIfDefined("CutOffTime", body.CutOffTime);

    /* ================================
       TIME
    ================================= */
    setIfDefined("open_time", body.open_time);
    setIfDefined("closed_time", body.closed_time);

    /* ================================
       DELIVERY
    ================================= */
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

    /* ================================
       TIMESTAMP
    ================================= */
    updateData.updated_at = new Date().toISOString();

    console.log("Final Update Data:", updateData);

    /* ================================
       UPDATE QUERY
    ================================= */
    const { data, error } = await supabase
      .from("RestroMaster")
      .update(updateData)
      .eq("RestroCode", restroCode)
      .select();

    if (error) {
      console.error("❌ Supabase error:", error);
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
    console.error("❌ PATCH ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
