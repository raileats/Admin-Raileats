// app/api/vendors/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// defensive
if (!SUPA_URL || !SUPA_KEY) {
  console.error("Missing SUPABASE env vars. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required.");
}

const supabaseAdmin = createClient(SUPA_URL ?? "", SUPA_KEY ?? "", {
  auth: { persistSession: false }
});

// GET: list with filters & pagination
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const status = (url.searchParams.get("status") ?? "").trim();
    const alpha = (url.searchParams.get("alpha") ?? "").trim();
    const station_code = (url.searchParams.get("station_code") ?? "").trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10));

    // base query
    let query = supabaseAdmin.from("vendors").select("*", { count: "exact" });

    // filters (combined sensibly)
    if (q) {
      // search in outlet_id, outlet_name, owner_mobile, fssai_no
      // use OR via Supabase .or() with ilike
      const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(
        `outlet_id.ilike.%${escaped}%,outlet_name.ilike.%${escaped}%,owner_mobile.ilike.%${escaped}%,fssai_no.ilike.%${escaped}%`
      );
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (alpha) {
      // names starting with letter
      query = query.ilike("outlet_name", `${alpha}%`);
    }
    if (station_code) {
      query = query.ilike("station_code", `${station_code}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("vendors.GET supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      count: typeof count === "number" ? count : (data ? data.length : 0),
      page,
      pageSize
    });
  } catch (err: any) {
    console.error("vendors.GET error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: bulk upsert (import). Expects { vendors: [ {...}, ... ] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body?.vendors) ? body.vendors : [];

    if (rows.length === 0) {
      return NextResponse.json({ inserted: 0 }, { status: 400 });
    }

    // Upsert by primary key 'outlet_id' (ensure your table has outlet_id PRIMARY KEY)
    const { data, error } = await supabaseAdmin.from("vendors").upsert(rows);

    if (error) {
      console.error("vendors.POST supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ inserted: Array.isArray(data) ? data.length : 0 });
  } catch (err: any) {
    console.error("vendors.POST error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
