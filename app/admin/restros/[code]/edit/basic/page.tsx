// app/api/restromaster/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const TABLENAME = "RestroMaster";

/* ---------------- GET : LIST / SEARCH ---------------- */
function sanitizeSearch(q: string) {
  return q.replace(/[%_']/g, "").trim();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = (url.searchParams.get("q") || "").trim();
    const q = sanitizeSearch(qRaw);

    let builder = supabaseServer
      .from(TABLENAME)
      .select("*")
      .order("RestroName", { ascending: true })
      .limit(1000);

    if (q) {
      const pattern = `%${q}%`;
      builder = supabaseServer
        .from(TABLENAME)
        .select("*")
        .or(
          `RestroCode.ilike.${pattern},RestroName.ilike.${pattern},OwnerName.ilike.${pattern},StationCode.ilike.${pattern}`
        )
        .order("RestroName", { ascending: true })
        .limit(1000);
    }

    const { data, error } = await builder;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/* ---------------- PATCH : EDIT RESTRO ---------------- */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const code = body?.RestroCode;

    if (!code) {
      return NextResponse.json(
        { error: "RestroCode required" },
        { status: 400 }
      );
    }

    const allowed = new Set([
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
    ]);

    const updates: any = {};
    for (const k of Object.keys(body)) {
      if (allowed.has(k)) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from(TABLENAME)
      .update(updates)
      .eq("RestroCode", code)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/* ---------------- POST : ADD NEW RESTRO ---------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 👉 sirf name mandatory
    if (!body.RestroName) {
      return NextResponse.json(
        { error: "RestroName required" },
        { status: 400 }
      );
    }

    // 🔥 last RestroCode nikaalo
    const { data: lastRow } = await supabaseServer
      .from(TABLENAME)
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1)
      .single();

    const newRestroCode = Number(lastRow?.RestroCode || 1000) + 1;

    // 🔥 new restro insert
    const insertPayload = {
      ...body,
      RestroCode: newRestroCode,
      Status: "DRAFT",
    };

    const { data, error } = await supabaseServer
      .from(TABLENAME)
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
