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

    /* 🔥 ================= STATION FIX ================= */

    if (body.StationCode !== undefined)
      payload.StationCode = body.StationCode;

    if (body.StationName !== undefined)
      payload.StationName = body.StationName;

    if (body.State !== undefined)
      payload.State = body.State;

    /* 🔥 ================= TIME FIX ================= */

    if (body.open_time !== undefined)
      payload.open_time = body.open_time;

    if (body.closed_time !== undefined)
      payload.closed_time = body.closed_time;

    /* 🔥 ================= ORDER SETTINGS ================= */

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

    /* 🔥 ================= BASIC INFO FIX ================= */

    if (body.RestroName !== undefined)
      payload.RestroName = body.RestroName;

    if (body.OwnerName !== undefined)
      payload.OwnerName = body.OwnerName;

    if (body.OwnerEmail !== undefined)
      payload.OwnerEmail = body.OwnerEmail;

    if (body.OwnerPhone !== undefined)
      payload.OwnerPhone = body.OwnerPhone;

    if (body.RestroEmail !== undefined)
      payload.RestroEmail = body.RestroEmail;

    if (body.RestroPhone !== undefined)
      payload.RestroPhone = body.RestroPhone;

    if (body.BrandNameifAny !== undefined)
      payload.BrandNameifAny = body.BrandNameifAny;

    if (body.RestroRating !== undefined)
      payload.RestroRating = body.RestroRating;

    if (body.IsIrctcApproved !== undefined)
      payload.IsIrctcApproved = body.IsIrctcApproved;

    if (body.RaileatsStatus !== undefined)
      payload.RaileatsStatus = body.RaileatsStatus;

    /* ✅ TIMESTAMP */
    payload.UpdatedAt = new Date().toISOString();

    console.log("🔥 Final payload:", payload);

    /* ================= UPDATE ================= */

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", RestroCode)
      .select();

    console.log("✅ Updated row:", data);

    if (error) {
      console.error("❌ Supabase error:", error);
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
    console.error("❌ PATCH FAILED:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
