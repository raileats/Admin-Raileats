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

    /* =============================
       MAP UI → DB COLUMN NAMES
    ============================== */
    const payload: any = {
      /* -------- Station Settings -------- */
      WeeklyOff: body.WeeklyOff ?? null,
      "0penTime": body.OpenTime ?? null, // ❗ ZERO
      ClosedTime: body.ClosedTime ?? null,
      CutOffTime: body.CutOffTime ?? null,
      MinimumOrdermValue: body.MinimumOrderValue ?? null,

      RaileatsCustomerDeliveryCharge:
        body.RaileatsDeliveryCharge ?? null,

      RaileatsCustomerDeliveryChargeGSTRate:
        body.RaileatsDeliveryChargeGSTRate ?? null,

      RaileatsCustomerDeliveryChargeGST:
        body.RaileatsDeliveryChargeGST ?? null,

      RaileatsCustomerDeliveryChargeTotalInclGST:
        body.RaileatsDeliveryChargeTotalInclGST ?? null,

      RaileatsOrdersPaymentOptionforCustomer:
        body.OrdersPaymentOptionForCustomer ?? null,

      IRCTCOrdersPaymentOptionforCustomer:
        body.IRCTCOrdersPaymentOptionForCustomer ?? null,

      RestroTypeofDeliveryRailEatsorVendor:
        body.RestroTypeOfDelivery ?? null,

      /* -------- Contacts (KEEP OLD LOGIC) -------- */
      EmailAddressName1: body.EmailAddressName1 ?? null,
      EmailsforOrdersReceiving1: body.EmailsforOrdersReceiving1 ?? null,
      EmailsforOrdersStatus1: body.EmailsforOrdersStatus1 ?? null,

      EmailAddressName2: body.EmailAddressName2 ?? null,
      EmailsforOrdersReceiving2: body.EmailsforOrdersReceiving2 ?? null,
      EmailsforOrdersStatus2: body.EmailsforOrdersStatus2 ?? null,

      WhatsappMobileNumberName1: body.WhatsappMobileNumberName1 ?? null,
      WhatsappMobileNumberforOrderDetails1:
        body.WhatsappMobileNumberforOrderDetails1 ?? null,
      WhatsappMobileNumberStatus1:
        body.WhatsappMobileNumberStatus1 ?? null,

      WhatsappMobileNumberName2: body.WhatsappMobileNumberName2 ?? null,
      WhatsappMobileNumberforOrderDetails2:
        body.WhatsappMobileNumberforOrderDetails2 ?? null,
      WhatsappMobileNumberStatus2:
        body.WhatsappMobileNumberStatus2 ?? null,

      WhatsappMobileNumberName3: body.WhatsappMobileNumberName3 ?? null,
      WhatsappMobileNumberforOrderDetails3:
        body.WhatsappMobileNumberforOrderDetails3 ?? null,
      WhatsappMobileNumberStatus3:
        body.WhatsappMobileNumberStatus3 ?? null,
    };

    /* =============================
       CLEAN UNDEFINED
    ============================== */
    const cleaned: any = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) cleaned[k] = v;
    }

    if (Object.keys(cleaned).length === 0) {
      return NextResponse.json({ ok: true, message: "Nothing to update" });
    }

    /* =============================
       UPDATE DB
    ============================== */
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
