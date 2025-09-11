// before: import { createClient } from '@supabase/supabase-js'
// DO NOT create client at top-level

import { NextResponse } from 'next/server';
import db from '@/lib/db'; // use db if possible

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');// app/api/vendors/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from("outlets").select("*").limit(50);
      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      const res = await db.query("SELECT * FROM outlets ORDER BY id DESC LIMIT $1", [50]);
      return NextResponse.json({ data: res.rows });
    }
  } catch (err) {
    console.error("GET /api/vendors error:", err);
    return NextResponse.json({ error: "Failed to fetch vendors", details: String(err) }, { status: 500 });
  }
}

  return createClient(url, key);
}

export async function GET(req: Request) {
  // if you need supabase:
  const supabase = getSupabaseClient();
  if (supabase) {
    // use supabase (server-side) ...
  } else {
    // fallback to using db (lib/db.js) or return a helpful error
  }
}
