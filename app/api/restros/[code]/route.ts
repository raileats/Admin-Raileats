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
    /* ================= RestroCode ================= */
    const RestroCode = Number(params.code);
    if (!RestroCode) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    /* ================= Read body ================= */
    const body = await req.json();

    /* ================= Payload (EXACT DB MATCH) ================= */
    const payload: any = {
      // ---- Station Settings ----
      WeeklyOff: body.WeeklyOff ?? null,
      OpenTime: body.OpenTime ?? null, // ✅ EXACT
      ClosedTime: body.ClosedTime ?? null,
      MinimumOrderValue: body.MinimumOrderValue ?? null,
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
        body.RaileatsOrdersPaymentOptionforCustomer ?? null,

      IRCTCOrdersPaymentOptionforCustomer:
        body.IRCTCOrdersPaymentOptionforCustomer ?? null,

      RestroTypeofDeliveryRailEatsorVendor:
        body.RestroTypeofDeliveryRailEatsorVendor ?? null,

      // ---- Basic Info (safe to include) ----
      StationCode: body.StationCode ?? null,
      StationName: body.StationName ?? null,
      RestroName: body.RestroName ?? null,
      OwnerName: body.OwnerName ?? null,
      OwnerEmail: body.OwnerEmail ?? null,
      OwnerPhone: body.OwnerPhone ?? null,
      RestroEmail: body.RestroEmail ?? null,
      RestroPhone: body.RestroPhone ?? null,
      BrandNameifAny: body.BrandNameifAny ?? null,

      RaileatsStatus: body.RaileatsStatus ?? null,
      IsIrctcApproved: body.IsIrctcApproved ?? null,
      RestroRating: body.RestroRating ?? null,
    };

    /* ================= Remove undefined only ================= */
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    /* ================= Update Supabase ================= */
    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", RestroCode)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (err: any) {
    console.error("PATCH /api/restros/[code] failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
