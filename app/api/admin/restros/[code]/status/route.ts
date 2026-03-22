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
   PATCH API
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
       SAFE PAYLOAD (NO UNDEFINED)
    ================================= */

    const updateData: any = {};

    const setIfDefined = (key: string, value: any) => {
      if (value !== undefined) updateData[key] = value;
    };

    // ✅ BASIC INFO
    setIfDefined("RestroName", body.RestroName);
    setIfDefined("OwnerName", body.OwnerName);
    setIfDefined("OwnerEmail", body.OwnerEmail);
    setIfDefined("OwnerPhone", body.OwnerPhone);
    setIfDefined("RestroEmail", body.RestroEmail);
    setIfDefined("RestroPhone", body.RestroPhone);
    setIfDefined("BrandNameifAny", body.BrandNameifAny || body.BrandName);
    setIfDefined("RestroRating", body.RestroRating);

    // ✅ STATUS
    setIfDefined("IsIrctcApproved", body.IsIrctcApproved);
    setIfDefined("RaileatsStatus", body.RaileatsStatus);

    // ✅ STATION SETTINGS
    setIfDefined("WeeklyOff", body.WeeklyOff);
    setIfDefined("MinimumOrderValue", body.MinimumOrderValue);
    setIfDefined("CutOffTime", body.CutOffTime);

    // ✅ TIME FIX
    setIfDefined("open_time", body.open_time);
    setIfDefined("closed_time", body.closed_time);

    // ✅ DELIVERY
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

    setIfDefined(
      "RaileatsOrdersPaymentOptionforCustomer",
      body.RaileatsOrdersPaymentOptionforCustomer
    );

    setIfDefined(
      "IRCTCOrdersPaymentOptionforCustomer",
      body.IRCTCOrdersPaymentOptionforCustomer
    );

    setIfDefined(
      "RestroTypeofDeliveryRailEatsorVendor",
      body.RestroTypeofDeliveryRailEatsorVendor
    );

    // ✅ TIMESTAMP
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

    console.log("Updated Row:", data);

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
