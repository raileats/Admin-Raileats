// app/api/test-db/route.ts
export const runtime = "nodejs"; // Node.js runtime required

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Env variables (already set in Vercel)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client (server-side)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export async function GET() {
  try {
    // ⚠️ यहाँ "your_table" को अपनी असली table का नाम से बदलें
    const { data, error } = await supabase.from("your_table").select("*").limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
