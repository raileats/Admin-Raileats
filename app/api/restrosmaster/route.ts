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
    const qRaw = url.searchParams.get("q") || "";
    const q = sanitizeSearch(qRaw);

    let query = supabaseServer
      .from(TABLE)
      .select("*")
      .order("CreatedAt", { ascending: false }) // ✅ ONLY ORDER
      .limit(1000);

    if (q) {
      const pattern = `%${q}%`;
      query = supabaseServer
        .from(TABLE)
        .select("*")
        .or(
          [
            `RestroCode.ilike.${pattern}`,
            `RestroName.ilike.${pattern}`,
            `OwnerName.ilike.${pattern}`,
            `StationCode.ilike.${pattern}`,
            `StationName.ilike.${pattern}`,
          ].join(",")
        )
        .order("CreatedAt", { ascending: false }) // ✅ SAME
        .limit(1000);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    console.error("GET RestroMaster error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
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
  "BrandNameifAny",   // ✅ exact column
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
  "RaileatsStatus",   // ✅ exact
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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
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

    // 🔴 Minimum required fields
    if (!body.RestroName || !body.StationCode || !body.StationName) {
      return NextResponse.json(
        { error: "RestroName, StationCode and StationName are required" },
        { status: 400 }
      );
    }

    /* 🔥 STEP 1: Get LAST RestroCode */
    const { data: lastRows, error: lastErr } = await supabaseServer
      .from(TABLE)
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1);

    if (lastErr) throw lastErr;

    const lastCode = Number(lastRows?.[0]?.RestroCode ?? 1010);
    const newRestroCode = lastCode + 1;

    /* 🔥 STEP 2: Insert new restro */
    const insertPayload = {
  ...body,
  RestroCode: newRestroCode,

  // ✅ DB column
  RaileatsStatus: body.RaileatsStatus ?? 0,

  // ❌ Status / CreatedAt / UpdatedAt कभी मत भेजो
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
