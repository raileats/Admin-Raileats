// app/api/admin/restro/[code]/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = makeSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "SUPABASE not configured" }, { status: 500 });

    const code = (params.code || "").toString();
    if (!code) return NextResponse.json({ error: "restro code required" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const raileats = body.raileats;
    if (typeof raileats !== "boolean") {
      return NextResponse.json({ error: "body must include { raileats: boolean }" }, { status: 400 });
    }

    // find RestroMaster table — attempt common names
    const candidates = ["RestroMaster", "restros", "restromaster", "Restro_Master"];
    let tableFound: string | null = null;
    for (const t of candidates) {
      try {
        const { error } = await supabase.from(t).select("RestroCode").eq("RestroCode", code).limit(1);
        if (!error) {
          tableFound = t;
          break;
        }
      } catch (e) { /* ignore */ }
    }
    if (!tableFound) return NextResponse.json({ error: "Could not locate restro table" }, { status: 500 });

    // Update RaileatsStatus field — set 1/0
    const newVal = raileats ? 1 : 0;
    const updatePayload: any = {};
    if (["RestroMaster", "restromaster", "Restro_Master"].includes(tableFound)) {
      // RestroMaster uses 'RaileatsStatus' column
      updatePayload.RaileatsStatus = newVal;
    } else {
      // generic fallback attempt
      updatePayload.RaileatsStatus = newVal;
    }

    const { data, error } = await supabase.from(tableFound).update(updatePayload).eq("RestroCode", code).select().maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, updated: data ?? null });
  } catch (err) {
    console.error("admin restro patch error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
