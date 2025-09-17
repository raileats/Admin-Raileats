// app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Mapping client keys (PascalCase or snake_case) to DB column names (snake_case)
const ALLOWED_MAP: Record<string, string> = {
  RestroName: "restro_name",
  restro_name: "restro_name",

  OwnerName: "owner_name",
  owner_name: "owner_name",

  StationCode: "station_code",
  station_code: "station_code",

  StationName: "station_name",
  station_name: "station_name",

  OwnerPhone: "owner_phone",
  owner_phone: "owner_phone",

  OwnerEmail: "owner_email",
  owner_email: "owner_email",

  RestroEmail: "restro_email",
  restro_email: "restro_email",

  RestroPhone: "restro_phone",
  restro_phone: "restro_phone",

  BrandName: "brand_name",
  brand_name: "brand_name",

  RaileatsStatus: "raileats",
  raileats: "raileats",

  IRCTCStatus: "irctc",
  irctc: "irctc",

  IsIrctcApproved: "is_irctc_approved",
  is_irctc_approved: "is_irctc_approved",

  Rating: "rating",
  rating: "rating",

  IsPureVeg: "is_pure_veg",
  is_pure_veg: "is_pure_veg",

  RestroDisplayPhoto: "restro_display_photo",
  restro_display_photo: "restro_display_photo",

  FSSAINumber: "fssai_number",
  fssai_number: "fssai_number",

  FSSAIExpiryDate: "fssai_expiry_date",
  fssai_expiry_date: "fssai_expiry_date",
};

function normalizeValue(key: string, value: any) {
  // handle boolean-ish values for status fields
  if (["raileats", "irctc", "is_irctc_approved", "is_pure_veg"].includes(key)) {
    if (value === true || value === 1 || value === "1" || value === "yes" || value === "on") return 1;
    return 0;
  }
  if (key === "rating") {
    if (value === "" || value == null) return null;
    return Number(value);
  }
  return value;
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params.code;
    const body = (await req.json()) || {};

    // Build updates object
    const updates: Record<string, any> = {};
    for (const k of Object.keys(body)) {
      const dbCol = ALLOWED_MAP[k];
      if (dbCol) {
        updates[dbCol] = normalizeValue(dbCol, body[k]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Numeric or string code
    const numeric = Number(codeParam);
    let query = supabaseServer.from("RestroMaster").update(updates).select();
    if (!Number.isNaN(numeric)) {
      query = (query as any).eq("restro_code", numeric);
    } else {
      query = (query as any).eq("restro_code", codeParam);
    }

    const { data, error } = await query.limit(1);
    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message ?? "Update failed" }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] ?? null : data ?? null;
    return NextResponse.json({ ok: true, row });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
