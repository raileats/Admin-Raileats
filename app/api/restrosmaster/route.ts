// app/api/restrosmaster/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const TABLE = "RestroMaster";

/* ---------------- UTILS ---------------- */
function sanitizeSearch(q: string) {
  return q.replace(/[%_']/g, "").trim();
}

/* ============================
   GET : LIST / SEARCH RESTROS
   ============================ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();

    let query = supabaseServer
      .from("RestroMaster")
      .select("*")
      .order("RestroCode", { ascending: false }) // 🔥 MAIN FIX
      .limit(1000);

    if (q) {
      const pattern = `%${q}%`;
      query = query.or(
        [
          `RestroCode.ilike.${pattern}`,
          `RestroName.ilike.${pattern}`,
          `OwnerName.ilike.${pattern}`,
          `StationCode.ilike.${pattern}`,
          `StationName.ilike.${pattern}`,
        ].join(",")
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


/* ============================
   PATCH : UPDATE RESTRO
   ============================ */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const restroCode = body?.RestroCode;

    if (!restroCode) {
      return NextResponse.json(
        { error: "RestroCode is required for update" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "RestroName",
      "BrandNameifAny",
      "StationCode",
      "StationName",
      "State",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "RestroEmail",
      "RestroPhone",
      "RestroRating",
      "RestroDisplayPhoto",
      "RaileatsStatus",
      "IsIrctcApproved",
      "FSSAINumber",
      "FSSAIExpiryDate",
    ];

    const updates: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const { data, error } = await supabaseServer
      .from(TABLE)
      .update(updates)
      .eq("RestroCode", restroCode)
      .select()
      .limit(1);

    if (error) throw error;

    return NextResponse.json(data?.[0] ?? null);
  } catch (err: any) {
    console.error("PATCH RestroMaster error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

/* ============================
   POST : ADD NEW RESTRO
   ============================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.RestroName || !body.StationCode || !body.StationName) {
      return NextResponse.json(
        { error: "RestroName, StationCode and StationName are required" },
        { status: 400 }
      );
    }

    // 🔥 LAST RestroCode (highest)
    const { data: lastRows, error: lastErr } = await supabaseServer
      .from(TABLE)
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1);

    if (lastErr) throw lastErr;

    const newRestroCode = Number(lastRows?.[0]?.RestroCode ?? 1010) + 1;

    const insertPayload = {
      ...body,
      RestroCode: newRestroCode,
      RaileatsStatus: body.RaileatsStatus ?? 0,
    };

    const { data, error } = await supabaseServer
      .from(TABLE)
      .insert([insertPayload])
      .select()
      .limit(1);

    if (error) throw error;

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err: any) {
    console.error("POST RestroMaster error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
