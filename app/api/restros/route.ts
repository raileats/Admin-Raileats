// app/api/restros/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // make sure this exports a server-side supabase client

export async function GET() {
  try {
    // change/select columns explicitly if you want:
    const { data, error } = await supabaseServer
      .from("RestroMaster")    // <-- table name from your PATCH route
      .select("*")
      .order("id", { ascending: true })
      .limit(1000); // adjust limit/pagination as needed

    if (error) {
      console.error("Supabase GET restros error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("GET /api/restros exception:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
