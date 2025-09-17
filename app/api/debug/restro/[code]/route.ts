// app/api/debug/restro/[code]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer"; // if exists in your repo

const PUB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = params.code;
  const numeric = Number(code);

  const results: any = {};

  // 1) try public client (lib/restroService style)
  try {
    const pub = createClient(PUB_URL, PUB_KEY);
    let q = pub.from("RestroMaster").select("*");
    if (!Number.isNaN(numeric)) q = (q as any).eq("RestroCode", numeric);
    else q = (q as any).eq("RestroCode", code);
    const { data, error } = await q.limit(1);
    results.public = { data, error: error ? String(error) : null };
  } catch (e: any) {
    results.public = { error: String(e) };
  }

  // 2) try server client if available
  try {
    if (!supabaseServer) throw new Error("supabaseServer not found/importable");
    let q2 = supabaseServer.from("RestroMaster").select("*");
    if (!Number.isNaN(numeric)) q2 = (q2 as any).eq("RestroCode", numeric);
    else q2 = (q2 as any).eq("RestroCode", code);
    const { data, error } = await q2.limit(1);
    results.server = { data, error: error ? String(error) : null };
  } catch (e: any) {
    results.server = { error: String(e) };
  }

  // 3) return environment snapshot (non-secret)
  results.env = {
    has_pub_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_pub_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  return NextResponse.json(results);
}
