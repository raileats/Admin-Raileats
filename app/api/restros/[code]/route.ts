// app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // आपका server-side supabase client

// whitelist of allowed fields to be updated from clients
const ALLOWED = new Set([
  "RestroName",
  "OwnerName",
  "StationCode",
  "StationName",
  "OwnerPhone",
  "OwnerEmail",
  "FSSAINumber",
  "FSSAIExpiryDate",
  "IRCTCStatus",
  "RaileatsStatus",
  "IsIrctcApproved",
  // add more column names here if you want them editable
]);

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params.code;
    const body = (await req.json()) || {};

    // Build updates object by whitelisting
    const updates: Record<string, any> = {};
    for (const k of Object.keys(body)) {
      if (ALLOWED.has(k)) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Prefer numeric match if the code looks numeric
    const numeric = Number(codeParam);
    let query = supabaseServer.from("RestroMaster").update(updates).select();

    if (!Number.isNaN(numeric)) {
      query = (query as any).eq("RestroCode", numeric);
    } else {
      query = (query as any).eq("RestroCode", codeParam);
    }

    // Execute update and return the updated row (single)
    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message ?? "Update failed" }, { status: 500 });
    }

    // data will be an array (because select() with limit) — normalize to single row if present
    const row = Array.isArray(data) ? data[0] ?? null : data ?? null;

    return NextResponse.json({ ok: true, row });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

// For other methods, you can optionally add handlers or return 405
export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
export function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
