// app/admin/api/debug/restro/[code]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer"; // अगर आपके repo में है

const PUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = params.code;
  const numeric = Number(code);

  const out: any = {};

  // public client try
  try {
    if (!PUB_URL || !PUB_KEY) {
      out.public = { error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY" };
    } else {
      const pub = createClient(PUB_URL, PUB_KEY);
      let q: any = pub.from("RestroMaster").select("*");
      q = !Number.isNaN(numeric) ? q.eq("RestroCode", numeric) : q.eq("RestroCode", code);
      const { data, error } = await q.limit(1);
      out.public = { data: data ?? null, error: error ? String(error) : null };
    }
  } catch (e: any) {
    out.public = { error: String(e) };
  }

  // server client try
  try {
    if (!supabaseServer) {
      out.server = { error: "supabaseServer import not found" };
    } else {
      let q2: any = supabaseServer.from("RestroMaster").select("*");
      q2 = !Number.isNaN(numeric) ? q2.eq("RestroCode", numeric) : q2.eq("RestroCode", code);
      const { data, error } = await q2.limit(1);
      out.server = { data: data ?? null, error: error ? String(error) : null };
    }
  } catch (e: any) {
    out.server = { error: String(e) };
  }

  out.env = {
    has_pub_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_pub_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  return NextResponse.json(out);
}
