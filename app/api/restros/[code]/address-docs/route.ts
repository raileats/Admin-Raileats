export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function cleanText(value: any) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const next = String(value).trim();
  return next === "" ? null : next;
}

function cleanNumber(value: any) {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  const next = Number(value);
  return Number.isNaN(next) ? null : next;
}

function setIfDefined(payload: Record<string, any>, key: string, value: any) {
  if (value !== undefined) payload[key] = value;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = Number(params.code);

    if (!restroCode || Number.isNaN(restroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .select(
        "RestroCode,RestroAddress,City,State,District,PinCode,RestroLatitude,RestroLongitude,FSSAINumber,FSSAIExpiryDate,FSSAICopyUpload,FSSAIStatus,GSTNumber,GSTType,GSTCopyUpload,GSTStatus,PANNumber,PANType,PANCopyUpload,PANStatus"
      )
      .eq("RestroCode", restroCode)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

async function saveAddress(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = Number(params.code);

    if (!restroCode || Number.isNaN(restroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const payload: Record<string, any> = {};

    setIfDefined(payload, "RestroAddress", cleanText(body.RestroAddress));
    setIfDefined(payload, "City", cleanText(body.City));
    setIfDefined(payload, "State", cleanText(body.State));
    setIfDefined(payload, "District", cleanText(body.District));
    setIfDefined(payload, "PinCode", cleanText(body.PinCode));
    setIfDefined(payload, "RestroLatitude", cleanNumber(body.RestroLatitude));
    setIfDefined(payload, "RestroLongitude", cleanNumber(body.RestroLongitude));

    payload.UpdatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", restroCode)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export const POST = saveAddress;
export const PATCH = saveAddress;
