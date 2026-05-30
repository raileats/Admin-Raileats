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

const TEXT_FIELDS = [
  "EmailAddressName1",
  "EmailsforOrdersReceiving1",
  "EmailAddressName2",
  "EmailsforOrdersReceiving2",
  "WhatsappMobileNumberName1",
  "WhatsappMobileNumberName2",
  "WhatsappMobileNumberName3",
] as const;

const STATUS_FIELDS = [
  "EmailsforOrdersStatus1",
  "EmailsforOrdersStatus2",
  "WhatsappMobileNumberStatus1",
  "WhatsappMobileNumberStatus2",
  "WhatsappMobileNumberStatus3",
] as const;

const MOBILE_FIELDS = [
  "WhatsappMobileNumberforOrderDetails1",
  "WhatsappMobileNumberforOrderDetails2",
  "WhatsappMobileNumberforOrderDetails3",
] as const;

function parseCode(value: string) {
  const code = Number(value);
  return code && !Number.isNaN(code) ? code : null;
}

function text(value: any) {
  return String(value ?? "").trim();
}

function mobile(value: any) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);
  return digits ? Number(digits) : null;
}

function normalizeStatus(value: any) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (["1", "true", "on", "active", "yes"].includes(normalized)) {
    return "ON";
  }

  return "OFF";
}

function sameStatus(actual: any, expected: any) {
  return normalizeStatus(actual) === normalizeStatus(expected);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = parseCode(params.code);

  if (!restroCode) {
    return NextResponse.json({ ok: false, error: "Invalid RestroCode" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("RestroMaster")
    .select(CONTACT_COLUMNS)
    .eq("RestroCode", restroCode)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
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
      return NextResponse.json({ ok: false, error: "Invalid RestroCode" }, { status: 400 });
    }

    const body = await req.json();
    const payload: Record<string, any> = {};

    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) {
        payload[field] = text(body[field]);
      }
    }

    for (const field of MOBILE_FIELDS) {
      if (body[field] !== undefined) {
        payload[field] = mobile(body[field]);
      }
    }

    for (const field of STATUS_FIELDS) {
      if (body[field] !== undefined) {
        payload[field] = normalizeStatus(body[field]);
      }
    }

    payload.UpdatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", restroCode)
      .select(CONTACT_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    for (const field of STATUS_FIELDS) {
      if (payload[field] !== undefined && !sameStatus(data?.[field], payload[field])) {
        return NextResponse.json(
          {
            ok: false,
            error: `${field} save verify failed. Expected ${payload[field]}, got ${data?.[field] ?? "blank"}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Contacts save failed" },
      { status: 500 }
    );
  }
}
