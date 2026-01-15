// app/api/restros/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    /* -------------------------------
       STEP 1: RestroCode FIX (number)
    -------------------------------- */
    const codeRaw = params.code;
    if (!codeRaw) {
      return NextResponse.json(
        { ok: false, error: "Missing RestroCode" },
        { status: 400 }
      );
    }

    const RestroCode = /^\d+$/.test(codeRaw)
      ? Number(codeRaw)
      : codeRaw;

    /* -------------------------------
       STEP 2: Read request body
    -------------------------------- */
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* -------------------------------
       STEP 3: Build payload
       (MATCHES DB COLUMN NAMES)
    -------------------------------- */
    const payload: any = {};

    // ===== EMAILS =====
    payload.EmailAddressName1 =
      body.EmailAddressName1 ?? null;
    payload.EmailsforOrdersReceiving1 =
      body.EmailsforOrdersReceiving1 ?? null;
    payload.EmailsforOrdersStatus1 =
      body.EmailsforOrdersStatus1 ?? "OFF";

    payload.EmailAddressName2 =
      body.EmailAddressName2 ?? null;
    payload.EmailsforOrdersReceiving2 =
      body.EmailsforOrdersReceiving2 ?? null;
    payload.EmailsforOrdersStatus2 =
      body.EmailsforOrdersStatus2 ?? "OFF";

    // ===== WHATSAPP =====
    // DB has SINGLE column for names
    payload.WhatsappMobileNumberNames = [
      body.WhatsappMobileNumberName1,
      body.WhatsappMobileNumberName2,
      body.WhatsappMobileNumberName3,
    ]
      .filter(Boolean)
      .join(", ");

    payload.WhatsappMobileNumberforOrderDetails1 =
      body.WhatsappMobileNumberforOrderDetails1 ?? null;

    payload.WhatsappMobileNumberStatus =
      body.WhatsappMobileNumberStatus1 ?? "OFF";

    /* -------------------------------
       STEP 4: Remove empty payload
    -------------------------------- */
    const hasData = Object.values(payload).some(
      (v) => v !== null && v !== undefined && v !== ""
    );

    if (!hasData) {
      return NextResponse.json({
        ok: true,
        message: "Nothing to update",
      });
    }

    /* -------------------------------
       STEP 5: Update Supabase
    -------------------------------- */
    const { data, error } = await supabaseAdmin
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
    console.error("PATCH /api/restros/[code] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
