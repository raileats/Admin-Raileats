// app/api/restros/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json(); // expected to be object with fields to update

    // sanitize/whitelist fields allowed to update
    const allowed = [
      "RestroName",
      "StationCode",
      "StationName",
      "OwnerName",
      "OwnerPhone",
      "FSSAINumber",
      "FSSAIExpiryDate",
      "IRCTC",
      "Raileats",
      // add other DB columns you allow
    ];
    const payload: any = {};
    for (const k of Object.keys(body)) {
      if (allowed.includes(k)) payload[k] = body[k];
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    // match by numeric RestroCode if possible, else string
    const numeric = Number(id);
    let query = supabase.from("RestroMaster").update(payload).select().limit(1);
    if (!Number.isNaN(numeric)) query = (query as any).eq("RestroCode", numeric);
    else query = (query as any).eq("RestroCode", id);

    const { data, error } = await query;
    if (error) {
      console.error("supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, row: data && data[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
