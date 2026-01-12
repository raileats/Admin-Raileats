// app/api/restrosmaster/route.ts
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

    let query = supabaseServer
      .from(TABLENAME)
      .select("*")
      .order("RestroName", { ascending: true })
      .limit(1000);

    if (q) {
      const pattern = `%${q}%`;
      query = supabaseServer
        .from(TABLENAME)
        .select("*")
        .or(
          `RestroCode.ilike.${pattern},RestroName.ilike.${pattern},OwnerName.ilike.${pattern},StationCode.ilike.${pattern}`
        )
        .order("RestroName", { ascending: true })
        .limit(1000);
    }

    const { data, error } = await query;
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

    const allowed = [
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
    ];

    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
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
      .select();

    if (error) throw error;

    return NextResponse.json(data?.[0] ?? null);
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

    // 👉 Sirf RestroName required (RestroCode auto-generate hoga)
    if (!body.RestroName) {
      return NextResponse.json(
        { error: "RestroName required" },
        { status: 400 }
      );
    }

    // 🔥 Last RestroCode safely nikaalo (NO .single())
    const { data: rows, error: lastErr } = await supabaseServer
      .from(TABLENAME)
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1);

    if (lastErr) throw lastErr;

    const lastCode = rows?.[0]?.RestroCode ?? 1000;
    const newRestroCode = Number(lastCode) + 1;

    const insertPayload = {
      ...body,
      RestroCode: newRestroCode,
      Status: "DRAFT",
    };

    const { data, error } = await supabaseServer
      .from(TABLENAME)
      .insert([insertPayload])
      .select();

    if (error) throw error;

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
