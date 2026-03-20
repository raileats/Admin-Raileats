export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ================= SUPABASE CLIENT ================= */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false }
  }
);

/* ================= PATCH ================= */

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    console.log("===== PATCH CALLED =====");

    const RestroCode = Number(params.code);

    if (!RestroCode || isNaN(RestroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("Incoming body:", body);

    /* ================= SAFE PAYLOAD ================= */

    const payload: any = {};

    // ✅ ONLY VALID DB COLUMNS
    if (body.OpenTime !== undefined)
      payload.OpenTime = body.OpenTime;

    if (body.ClosedTime !== undefined)
      payload.ClosedTime = body.ClosedTime;

    if (body.MinimumOrderValue !== undefined)
      payload.MinimumOrderValue = body.MinimumOrderValue;

    if (body.CutOffTime !== undefined)
      payload.CutOffTime = body.CutOffTime;

    if (body.WeeklyOff !== undefined)
      payload.WeeklyOff = body.WeeklyOff;

    if (body.RaileatsCustomerDeliveryCharge !== undefined)
      payload.RaileatsCustomerDeliveryCharge =
        body.RaileatsCustomerDeliveryCharge;

    if (body.RaileatsCustomerDeliveryChargeGSTRate !== undefined)
      payload.RaileatsCustomerDeliveryChargeGSTRate =
        body.RaileatsCustomerDeliveryChargeGSTRate;

    if (body.RaileatsCustomerDeliveryChargeGST !== undefined)
      payload.RaileatsCustomerDeliveryChargeGST =
        body.RaileatsCustomerDeliveryChargeGST;

    if (body.RaileatsCustomerDeliveryChargeTotalInclGST !== undefined)
      payload.RaileatsCustomerDeliveryChargeTotalInclGST =
        body.RaileatsCustomerDeliveryChargeTotalInclGST;

    if (body.RaileatsOrdersPaymentOptionforCustomer !== undefined)
      payload.RaileatsOrdersPaymentOptionforCustomer =
        body.RaileatsOrdersPaymentOptionforCustomer;

    if (body.IRCTCOrdersPaymentOptionforCustomer !== undefined)
      payload.IRCTCOrdersPaymentOptionforCustomer =
        body.IRCTCOrdersPaymentOptionforCustomer;

    if (body.RestroTypeofDeliveryRailEatsorVendor !== undefined)
      payload.RestroTypeofDeliveryRailEatsorVendor =
        body.RestroTypeofDeliveryRailEatsorVendor;

    // ✅ timestamp
    payload.UpdatedAt = new Date().toISOString();

    console.log("Final payload:", payload);

    /* ================= UPDATE ================= */

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", RestroCode)
      .select();

    console.log("Updated row:", data);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No rows updated. Check RestroCode",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro updated successfully",
      row: data[0],
    });
  } catch (err: any) {
    console.error("PATCH FAILED:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
