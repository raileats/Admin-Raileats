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

    /* ===============================
       🔥 EXACT DB COLUMN MAPPING
    =============================== */
    const payload: any = {
      WeeklyOff: body.WeeklyOff ?? null,

      // ❗ ZERO wali spelling
      "0penTime": body.OpenTime ?? null,
      ClosedTime: body.ClosedTime ?? null,

      // ❗ spelling mistake in DB
      MinimumOrdermValue: body.MinimumOrderValue ?? null,

      CutOffTime: body.CutOffTime ?? null,

      RaileatsCustomerDeliveryCharge:
        body.RaileatsCustomerDeliveryCharge ?? null,

      RaileatsCustomerDeliveryChargeGSTRate:
        body.RaileatsCustomerDeliveryChargeGSTRate ?? null,

      RaileatsCustomerDeliveryChargeGST:
        body.RaileatsCustomerDeliveryChargeGST ?? null,

      RaileatsCustomerDeliveryChargeTotalInclGST:
        body.RaileatsCustomerDeliveryChargeTotalInclGST ?? null,

      RaileatsOrdersPaymentOptionforCustomer:
        body.RaileatsOrdersPaymentOptionForCustomer ?? null,

      IRCTCOrdersPaymentOptionforCustomer:
        body.IRCTCOrdersPaymentOptionForCustomer ?? null,

      RestroTypeofDeliveryRailEatsorVendor:
        body.RestroTypeOfDelivery ?? null,
    };

    /* ===============================
       CLEAN NULL / UNDEFINED
    =============================== */
    const cleaned: any = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) cleaned[k] = v;
    }

    if (!Object.keys(cleaned).length) {
      return NextResponse.json({ ok: true, message: "Nothing to update" });
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(cleaned)
      .eq("RestroCode", RestroCode)
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
