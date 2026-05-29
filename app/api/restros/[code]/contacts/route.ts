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

const ALLOWED_FIELDS = [
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
];

const BIGINT_CONTACT_FIELDS = new Set([
  "WhatsappMobileNumberforOrderDetails1",
  "WhatsappMobileNumberforOrderDetails2",
  "WhatsappMobileNumberforOrderDetails3",
]);

function parseCode(value: string) {
  const code = Number(value);
  return code && !Number.isNaN(code) ? code : null;
}

function normalizeContactValue(field: string, value: any) {
  if (BIGINT_CONTACT_FIELDS.has(field)) {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);
    return digits ? Number(digits) : null;
  }

  if (typeof value === "string") return value.trim();

  return value;
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
  const restroCode = parseCode(params.code);

  if (!restroCode) {
    return NextResponse.json({ ok: false, error: "Invalid RestroCode" }, { status: 400 });
  }

  const body = await req.json();
  const payload: Record<string, any> = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      payload[field] = normalizeContactValue(field, body[field]);
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

  return NextResponse.json({ ok: true, row: data });
}
