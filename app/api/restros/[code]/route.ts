import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = Number(params.code);
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();

    /* ===============================
       🔥 EXACT DB COLUMN MAPPING
       (deep-verified with schema)
    =============================== */
    const payload: any = {
      // ---------- Station / Status ----------
      StationCode: body.StationCode ?? null,
      StationName: body.StationName ?? null,
      WeeklyOff: body.WeeklyOff ?? null,

      // ⚠️ DB COLUMN HAS ZERO (0)
      "0penTime": body.OpenTime ?? null,
      ClosedTime: body.ClosedTime ?? null,

      // ---------- Order Rules ----------
      MinimumOrderValue: body.MinimumOrderValue ?? null,
      CutOffTime: body.CutOffTime ?? null,

      // ---------- Charges ----------
      RaileatsCustomerDeliveryCharge:
        body.RaileatsDeliveryCharge ?? null,

      RaileatsCustomerDeliveryChargeGSTRate:
        body.RaileatsDeliveryChargeGSTRate ?? null,

      RaileatsCustomerDeliveryChargeGST:
        body.RaileatsDeliveryChargeGST ?? null,

      RaileatsCustomerDeliveryChargeTotalInclGST:
        body.RaileatsDeliveryChargeTotalInclGST ?? null,

      // ---------- Payment Options ----------
      RaileatsOrdersPaymentOptionforCustomer:
        body.OrdersPaymentOptionForCustomer ?? null,

      IRCTCOrdersPaymentOptionforCustomer:
        body.IRCTCOrdersPaymentOptionForCustomer ?? null,

      // ---------- Delivery Type ----------
      RestroTypeofDeliveryRailEatsorVendor:
        body.RestroTypeOfDelivery ?? null,

      // ---------- Flags ----------
      RaileatsStatus:
        body.RaileatsStatus !== undefined
          ? Number(body.RaileatsStatus)
          : null,

      IsIrctcApproved:
        body.IsIrctcApproved !== undefined
          ? String(body.IsIrctcApproved)
          : null,

      RestroRating:
        body.RestroRating !== undefined
          ? Number(body.RestroRating)
          : null,
    };

    /* ===============================
       🧹 CLEAN NULL / UNDEFINED
    =============================== */
    const cleaned: any = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) cleaned[k] = v;
    }

    if (Object.keys(cleaned).length === 0) {
      return NextResponse.json({
        ok: true,
        message: "Nothing to update",
      });
    }

    /* ===============================
       🚀 UPDATE SUPABASE
    =============================== */
    const { data, error } = await supabase
      .from("RestroMaster")
      .update(cleaned)
      .eq("RestroCode", code)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      row: data,
    });
  } catch (err: any) {
    console.error("PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
