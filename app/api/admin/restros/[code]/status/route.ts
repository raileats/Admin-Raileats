// app/api/admin/restros/[code]/status/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PatchBody = {
  raileatsStatus: number | string | boolean; // 1 or 0 (or true/false)
};

function makeSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? process.env.SUPABASE_SERVICE_ROLE;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = makeSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_ROLE not set" }, { status: 500 });
    }

    const code = (params.code || "").toString().trim();
    if (!code) return NextResponse.json({ error: "Missing restro code in URL" }, { status: 400 });

    let body: PatchBody | null = null;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body.raileatsStatus === "undefined") {
      return NextResponse.json({ error: "raileatsStatus is required in body" }, { status: 400 });
    }

    // normalize to 1 or 0 (integer)
    const newStatus = ((): number => {
      const v = body!.raileatsStatus;
      if (typeof v === "boolean") return v ? 1 : 0;
      const n = Number(v);
      return Number.isNaN(n) ? 0 : (n === 1 ? 1 : 0);
    })();

    // prefer updating RestroMaster (admin table). If not present, try 'restros'
    const targetTables = ["RestroMaster", "restros", "RestroMaster_backup", "Restro_Master"]; // a few fallbacks
    let finalResult: any = null;
    let updatedTable: string | null = null;

    for (const tbl of targetTables) {
      try {
        // attempt update
        const { data, error } = await supabase
          .from(tbl)
          .update({ RaileatsStatus: newStatus })
          .eq("RestroCode", code)
          .select("*")
          .maybeSingle();

        if (error) {
          // If table does not exist or other DB error -> continue to next table
          // However if error is something else, log it and continue.
          console.warn(`Update attempt on ${tbl} returned error:`, error.message);
          // If error message clearly indicates "relation/table does not exist", skip quietly.
          continue;
        }

        // if update executed successfully (data may be null if no row matched)
        finalResult = data ?? null;
        updatedTable = tbl;
        break;
      } catch (err: any) {
        console.warn(`Exception while updating table ${tbl}:`, String(err));
        continue;
      }
    }

    if (!updatedTable) {
      return NextResponse.json(
        { error: "Could not update: no suitable table found or DB error" },
        { status: 500 }
      );
    }

    // success response
    return NextResponse.json(
      {
        success: true,
        table: updatedTable,
        restroCode: code,
        raileatsStatus: newStatus,
        updated: finalResult,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("admin/restros/status error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
