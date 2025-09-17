// app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * mapping incoming client keys -> actual DB column names
 * Accepts both PascalCase (used in your DB) and some common alternatives.
 */
const ALLOWED_MAP: Record<string, string> = {
  // PascalCase DB columns (primary)
  RestroName: "RestroName",
  OwnerName: "OwnerName",
  StationCode: "StationCode",
  StationName: "StationName",
  OwnerPhone: "OwnerPhone",
  OwnerEmail: "OwnerEmail",
  RestroEmail: "RestroEmail",
  RestroPhone: "RestroPhone",
  BrandNameifAny: "BrandNameifAny", // this exists in your DB
  RestroRating: "RestroRating",
  RestroDisplayPhoto: "RestroDisplayPhoto",
  FSSAINumber: "FSSAINumber",
  FSSAIExpiryDate: "FSSAIExpiryDate",
  IRCTCStatus: "IRCTCStatus",
  RaileatsStatus: "RaileatsStatus",
  IsIrctcApproved: "IsIrctcApproved",
  IsPureVeg: "IsPureVeg",

  // common snake_case alternatives that client may send (map them to PascalCase columns)
  restro_name: "RestroName",
  owner_name: "OwnerName",
  station_code: "StationCode",
  station_name: "StationName",
  owner_phone: "OwnerPhone",
  owner_email: "OwnerEmail",
  restro_email: "RestroEmail",
  restro_phone: "RestroPhone",
  brand_nameifany: "BrandNameifAny",
  restro_rating: "RestroRating",
  restro_display_photo: "RestroDisplayPhoto",
  fssai_number: "FSSAINumber",
  fssai_expiry_date: "FSSAIExpiryDate",
  irctc_status: "IRCTCStatus",
  raileats_status: "RaileatsStatus",
  is_irctc_approved: "IsIrctcApproved",
  is_pure_veg: "IsPureVeg",
  raileats: "RaileatsStatus",
  irctc: "IRCTCStatus",
  rating: "RestroRating",
};

/** normalize values for DB columns (convert booleans, numbers, empty -> null) */
function normalizeValue(dbCol: string, value: any) {
  // boolean-ish flags stored as 1/0 or "1"/"0" or "On"/"Off"
  const booleanCols = new Set(["RaileatsStatus", "IRCTCStatus", "IsIrctcApproved", "IsPureVeg"]);
  if (booleanCols.has(dbCol)) {
    if (
      value === true ||
      value === 1 ||
      value === "1" ||
      String(value).toLowerCase() === "true" ||
      String(value).toLowerCase() === "yes" ||
      String(value).toLowerCase() === "on"
    ) {
      return 1;
    }
    return 0;
  }

  // rating -> nullable number
  if (dbCol === "RestroRating") {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  // phone/account/order numeric fields: return as-is (DB can handle)
  if (dbCol === "OwnerPhone" || dbCol === "RestroPhone" || dbCol === "FSSAINumber") {
    // if empty string treat as null
    if (value === "" || value === null || value === undefined) return null;
    return value;
  }

  // strings: trim
  if (typeof value === "string") return value.trim();

  // default
  return value;
}

/** PATCH handler */
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params.code;
    const body = (await req.json()) || {};

    // build updates mapped to DB column names
    const updates: Record<string, any> = {};
    for (const k of Object.keys(body)) {
      const lookup = k as string;
      const mapKey = lookup in ALLOWED_MAP ? ALLOWED_MAP[lookup] : ALLOWED_MAP[lookup.toLowerCase()];
      if (mapKey) {
        updates[mapKey] = normalizeValue(mapKey, (body as any)[k]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    // prefer numeric match when code looks numeric
    const numeric = Number(codeParam);
    let query: any = supabaseServer.from("RestroMaster").update(updates).select();

    if (!Number.isNaN(numeric)) {
      query = query.eq("RestroCode", numeric);
    } else {
      query = query.eq("RestroCode", codeParam);
    }

    // execute update
    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "Update failed" }, { status: 500 });
    }

    // normalize row to single object
    const row = Array.isArray(data) ? (data[0] ?? null) : data ?? null;
    return NextResponse.json({ ok: true, row });
  } catch (err: any) {
    console.error("API error (PATCH /api/restros/[code]):", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

/** other methods not allowed */
export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
