export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ======================================================
   SUPABASE ADMIN CLIENT
====================================================== */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ======================================================
   PATCH → UPDATE RESTRO BY RESTROCODE
   URL: /api/restros/[code]
====================================================== */

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    /* ---------- Validate RestroCode ---------- */
    const RestroCode = Number(params.code);

    if (!RestroCode || isNaN(RestroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    /* ---------- Read Request Body ---------- */
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    /* ---------- Build Clean Payload ---------- */
    const payload: Record<string, any> = {};

    const allowedFields = [
      // Station
      "WeeklyOff",
      "OpenTime",
      "ClosedTime",
      "MinimumOrderValue",
      "CutOffTime",
      "RaileatsCustomerDeliveryCharge",
      "RaileatsCustomerDeliveryChargeGSTRate",
      "RaileatsCustomerDeliveryChargeGST",
      "RaileatsCustomerDeliveryChargeTotalInclGST",
      "RaileatsOrdersPaymentOptionforCustomer",
      "IRCTCOrdersPaymentOptionforCustomer",
      "RestroTypeofDeliveryRailEatsorVendor",

      // Basic
      "StationCode",
      "StationName",
      "RestroName",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "RestroEmail",
      "RestroPhone",
      "BrandNameifAny",
      "RaileatsStatus",
      "IsIrctcApproved",
      "RestroRating",
      "IsPureVeg",
      "RestroDisplayPhoto",
      "State",
      "City",
      "District",
      "PinCode",
      "RestroAddress",
      "FSSAINumber",
      "GSTNumber",
      "GSTType"
    ];

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        payload[key] = body[key];
      }
    }

    // Optional auto timestamp
    payload["UpdatedAt"] = new Date().toISOString();

    console.log("Updating RestroCode:", RestroCode);
    console.log("Payload keys:", Object.keys(payload));

    /* ---------- Update Supabase ---------- */
    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", RestroCode)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "No rows updated (RestroCode mismatch?)" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro updated successfully",
      row: data,
    });
  } catch (err: any) {
    console.error("PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
