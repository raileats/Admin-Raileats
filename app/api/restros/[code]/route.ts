import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const RestroCode = Number(params.code);
    if (!RestroCode) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();

    /* ================= EXACT DB MAPPING ================= */
    const payload: any = {
      WeeklyOff: body.WeeklyOff ?? null,

      // ❗ ZERO not O
      "0penTime": body.OpenTime || null,
      ClosedTime: body.ClosedTime || null,

      CutOffTime: body.CutOffTime ?? null,

      // ❗ extra m in DB
      MinimumOrdermValue: body.MinimumOrderValue ?? null,

      RaileatsCustomerDeliveryCharge:
        body.RaileatsDeliveryCharge ?? null,

      RaileatsCustomerDeliveryChargeGSTRate:
        body.RaileatsDeliveryChargeGSTRate != null
          ? String(body.RaileatsDeliveryChargeGSTRate)
          : null,

      RaileatsCustomerDeliveryChargeGST:
        body.RaileatsDeliveryChargeGST != null
          ? String(body.RaileatsDeliveryChargeGST)
          : null,

      RaileatsCustomerDeliveryChargeTotalInclGST:
        body.RaileatsDeliveryChargeTotalInclGST != null
          ? String(body.RaileatsDeliveryChargeTotalInclGST)
          : null,

      RaileatsOrdersPaymentOptionforCustomer:
        body.OrdersPaymentOptionForCustomer ?? null,

      IRCTCOrdersPaymentOptionforCustomer:
        body.IRCTCOrdersPaymentOptionForCustomer ?? null,

      RestroTypeofDeliveryRailEatsorVendor:
        body.RestroTypeOfDelivery ?? null,
    };

    /* ============== CLEAN UNDEFINED ============== */
    const cleaned: any = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) cleaned[k] = v;
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(cleaned)
      .eq("RestroCode", RestroCode)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (err: any) {
    console.error("PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
