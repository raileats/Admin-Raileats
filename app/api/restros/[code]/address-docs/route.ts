export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const FIELD_ALIASES: Record<string, string[]> = {
  RestroAddress: [
    "RestroAddress",
    "restro_address",
    "RestroAdress",
    "RestroAddres",
    "Address",
    "address",
    "OutletAddress",
    "outlet_address",
  ],
  City: ["City", "city", "CityVillage", "City_Village", "City / Village", "city_village"],
  State: ["State", "state"],
  District: ["District", "district"],
  PinCode: ["PinCode", "pin_code", "Pincode", "PINCode", "Pin", "pin"],
  RestroLatitude: ["RestroLatitude", "restro_latitude", "Latitude", "latitude", "Lat", "lat"],
  RestroLongitude: ["RestroLongitude", "restro_longitude", "Longitude", "longitude", "Long", "long", "Lng", "lng"],
};

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

function getRestroCode(raw: string) {
  const restroCode = Number(raw);
  return !restroCode || Number.isNaN(restroCode) ? null : restroCode;
}

function existingKey(row: Record<string, any>, canonical: string) {
  const aliases = FIELD_ALIASES[canonical] || [canonical];
  return aliases.find((key) => Object.prototype.hasOwnProperty.call(row, key)) || canonical;
}

function valueFromBody(body: Record<string, any>, canonical: string) {
  const aliases = FIELD_ALIASES[canonical] || [canonical];
  for (const key of [canonical, ...aliases]) {
    if (body[key] !== undefined) return body[key];
  }
  return undefined;
}

function toCanonicalRow(row: Record<string, any> | null) {
  if (!row) return null;

  const out: Record<string, any> = { ...row };
  Object.keys(FIELD_ALIASES).forEach((canonical) => {
    const key = existingKey(row, canonical);
    out[canonical] = row[key] ?? "";
  });

  return out;
}

async function loadRestro(restroCode: number) {
  return supabase
    .from("RestroMaster")
    .select("*")
    .eq("RestroCode", restroCode)
    .maybeSingle();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = getRestroCode(params.code);
    if (!restroCode) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const { data, error } = await loadRestro(restroCode);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Restro row not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, row: toCanonicalRow(data) });
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
    const restroCode = getRestroCode(params.code);
    if (!restroCode) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { data: existing, error: loadError } = await loadRestro(restroCode);

    if (loadError) {
      return NextResponse.json(
        { ok: false, error: loadError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Restro row not found. Save Basic Information first." },
        { status: 404 }
      );
    }

    const payload: Record<string, any> = {};

    const address = valueFromBody(body, "RestroAddress");
    const city = valueFromBody(body, "City");
    const state = valueFromBody(body, "State");
    const district = valueFromBody(body, "District");
    const pinCode = valueFromBody(body, "PinCode");
    const latitude = valueFromBody(body, "RestroLatitude");
    const longitude = valueFromBody(body, "RestroLongitude");

    if (address !== undefined) payload[existingKey(existing, "RestroAddress")] = cleanText(address);
    if (city !== undefined) payload[existingKey(existing, "City")] = cleanText(city);
    if (state !== undefined) payload[existingKey(existing, "State")] = cleanText(state);
    if (district !== undefined) payload[existingKey(existing, "District")] = cleanText(district);
    if (pinCode !== undefined) payload[existingKey(existing, "PinCode")] = cleanText(pinCode);
    if (latitude !== undefined) payload[existingKey(existing, "RestroLatitude")] = cleanNumber(latitude);
    if (longitude !== undefined) payload[existingKey(existing, "RestroLongitude")] = cleanNumber(longitude);

    if (Object.prototype.hasOwnProperty.call(existing, "UpdatedAt")) {
      payload.UpdatedAt = new Date().toISOString();
    } else if (Object.prototype.hasOwnProperty.call(existing, "updated_at")) {
      payload.updated_at = new Date().toISOString();
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No address fields received" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", restroCode)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "No row updated. Check RestroCode." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      row: toCanonicalRow(data),
      saved: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export const POST = saveAddress;
export const PATCH = saveAddress;
