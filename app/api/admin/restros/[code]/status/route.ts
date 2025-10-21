// ADMIN PROJECT
// app/api/admin/restros/[code]/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = makeSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server misconfigured: SUPABASE_SERVICE_ROLE not set" }, { status: 500 });
    }

    const code = (params.code || "").toString().trim();
    if (!code) return NextResponse.json({ error: "restro code required in URL" }, { status: 400 });

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // accept raileatsStatus as 1/0 or true/false or "1"/"0"
    if (typeof body.raileatsStatus === "undefined" && typeof body.raileats === "undefined") {
      return NextResponse.json({ error: "body must include raileatsStatus (or raileats)" }, { status: 400 });
    }
    const raw = typeof body.raileatsStatus !== "undefined" ? body.raileatsStatus : body.raileats;
    const newStatus = ((): number => {
      if (typeof raw === "boolean") return raw ? 1 : 0;
      const n = Number(raw);
      if (!Number.isNaN(n)) return n === 1 ? 1 : 0;
      return String(raw).toLowerCase() === "true" ? 1 : 0;
    })();

    // Update RestroMaster table — exact column names as in your DB
    const table = "RestroMaster"; // change only if your table has different name
    const updatePayload = { RaileatsStatus: newStatus };

    const { data, error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq("RestroCode", code)
      .select()
      .maybeSingle();

    if (error) {
      // If table not exist or other DB error, return informative message
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If data is null, row not found -> return 404
    if (!data) {
      return NextResponse.json({ error: `No row found with RestroCode=${code}` }, { status: 404 });
    }

    return NextResponse.json({ success: true, table, restroCode: code, raileatsStatus: newStatus, updated: data });
  } catch (err: any) {
    console.error("admin/restros/status error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
