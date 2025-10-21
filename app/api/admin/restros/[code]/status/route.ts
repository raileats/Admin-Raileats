// app/api/admin/restros/[code]/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

function makeClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = makeClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server misconfigured: SUPABASE_SERVICE_ROLE missing" }, { status: 500 });
    }

    const code = (params.code || "").toString();
    if (!code) return NextResponse.json({ error: "restro code required" }, { status: 400 });

    const body = await req.json();
    // expect body = { raileatsStatus: 1 } or { raileatsStatus: 0 }
    const raileatsStatus = Number(body?.raileatsStatus);
    if (isNaN(raileatsStatus) || (raileatsStatus !== 0 && raileatsStatus !== 1)) {
      return NextResponse.json({ error: "invalid raileatsStatus (must be 0 or 1)" }, { status: 400 });
    }

    const { error } = await supabase
      .from("RestroMaster")   // your table name as per screenshot
      .update({ RaileatsStatus: raileatsStatus })
      .eq("RestroCode", code);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, raileatsStatus });
  } catch (err) {
    console.error("admin/restros status patch error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
