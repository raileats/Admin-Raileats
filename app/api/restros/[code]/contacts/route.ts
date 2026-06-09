export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CONTACT_COLUMNS = [
  "RestroCode",
  "EmailAddressName1",
  "EmailsforOrdersReceiving1",
  "EmailsforOrdersStatus1",
  "EmailAddressName2",
  "EmailsforOrdersReceiving2",
  "EmailsforOrdersStatus2",
  "WhatsappMobileNumberName1",
  "WhatsappMobileNumberforOrderDetails1",
  "WhatsappMobileNumberStatus1",
  "WhatsappMobileNumberName2",
  "WhatsappMobileNumberforOrderDetails2",
  "WhatsappMobileNumberStatus2",
  "WhatsappMobileNumberName3",
  "WhatsappMobileNumberforOrderDetails3",
  "WhatsappMobileNumberStatus3",
].join(",");

function parseCode(value: string) {
  const code = Number(value);
  return code && !Number.isNaN(code) ? code : null;
}

function cleanText(value: any) {
  return String(value ?? "").trim();
}

function cleanMobile(value: any) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);
  return digits || null;
}

function normalizeStatus(value: any) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (["1", "true", "on", "active", "yes"].includes(normalized)) {
    return "ON";
  }

  return "OFF";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = parseCode(params.code);

  if (!restroCode) {
    return NextResponse.json(
      { ok: false, error: "Invalid RestroCode" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("RestroMaster")
    .select(CONTACT_COLUMNS)
    .eq("RestroCode", restroCode)
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, row: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = parseCode(params.code);

    if (!restroCode) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const payload: Record<string, any> = {
      EmailAddressName1: cleanText(body.EmailAddressName1),
      EmailsforOrdersReceiving1: cleanText(body.EmailsforOrdersReceiving1),
      EmailsforOrdersStatus1: normalizeStatus(body.EmailsforOrdersStatus1),

      EmailAddressName2: cleanText(body.EmailAddressName2),
      EmailsforOrdersReceiving2: cleanText(body.EmailsforOrdersReceiving2),
      EmailsforOrdersStatus2: normalizeStatus(body.EmailsforOrdersStatus2),

      WhatsappMobileNumberName1: cleanText(body.WhatsappMobileNumberName1),
      WhatsappMobileNumberforOrderDetails1: cleanMobile(
        body.WhatsappMobileNumberforOrderDetails1
      ),
      WhatsappMobileNumberStatus1: normalizeStatus(
        body.WhatsappMobileNumberStatus1
      ),

      WhatsappMobileNumberName2: cleanText(body.WhatsappMobileNumberName2),
      WhatsappMobileNumberforOrderDetails2: cleanMobile(
        body.WhatsappMobileNumberforOrderDetails2
      ),
      WhatsappMobileNumberStatus2: normalizeStatus(
        body.WhatsappMobileNumberStatus2
      ),

      WhatsappMobileNumberName3: cleanText(body.WhatsappMobileNumberName3),
      WhatsappMobileNumberforOrderDetails3: cleanMobile(
        body.WhatsappMobileNumberforOrderDetails3
      ),
      WhatsappMobileNumberStatus3: normalizeStatus(
        body.WhatsappMobileNumberStatus3
      ),

      UpdatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", restroCode);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const { data, error: readError } = await supabase
      .from("RestroMaster")
      .select(CONTACT_COLUMNS)
      .eq("RestroCode", restroCode)
      .single();

    if (readError) {
      return NextResponse.json(
        { ok: false, error: readError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      row: data,
      sent: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Contacts save failed" },
      { status: 500 }
    );
  }
}
