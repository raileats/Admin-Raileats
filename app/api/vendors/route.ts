// path: app/api/vendors/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * Vendors (RestroMaster) list + optional create.
 * Uses getSupabaseServer() so it won't crash the build if envs are missing.
 */

const COLUMNS = [
  "RestroCode",
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
].join(",");

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase server client not initialized — missing env vars");
      return NextResponse.json({ error: "server_client_not_initialized" }, { status: 500 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    let builder;
    if (q) {
      const pattern = `%${q}%`;
      builder = supabase
        .from("RestroMaster")
        .select(COLUMNS)
        .or(
          `RestroCode.ilike.${pattern},RestroName.ilike.${pattern},OwnerName.ilike.${pattern},StationCode.ilike.${pattern}`
        )
        .order("RestroName", { ascending: true })
        .limit(1000);
    } else {
      builder = supabase.from("RestroMaster").select(COLUMNS).order("RestroName", { ascending: true }).limit(1000);
    }

    const { data, error } = await builder;
    if (error) {
      console.error("GET /api/vendors supabase error:", error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("GET /api/vendors unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase server client not initialized — missing env vars");
      return NextResponse.json({ error: "server_client_not_initialized" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({} as any));
    if (!body.RestroCode || !body.RestroName) {
      return NextResponse.json({ error: "RestroCode and RestroName required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("RestroMaster").insert([body]).select().single();
    if (error) {
      console.error("POST /api/vendors supabase insert error:", error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/vendors unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
