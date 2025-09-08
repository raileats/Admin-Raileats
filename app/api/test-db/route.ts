// app/api/test-db/route.ts
export const runtime = "nodejs"; // ensure Node runtime for server libs

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// safety check
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // When deployed without envs, this gives clear error in logs/response
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// GET /api/test-db
export async function GET() {
  try {
    // CHANGE 'orders' below to your actual table name in Supabase
    const { data, error } = await supabase.from("orders").select("*").limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
