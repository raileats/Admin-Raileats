// app/api/admin/users/route.ts (Next.js route handlers)
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const user_type = url.searchParams.get("user_type") || "";

    let query = supabaseServer.from("users").select("*").order("seq", { ascending: true });

    if (q) {
      // search by name or mobile
      query = query.ilike("name", `%${q}%`).or(`mobile.ilike.%${q}%`);
      // Note: supabase-js chaining with OR may require rpc or filter combination; using simple approach:
      const { data, error } = await supabaseServer
        .from("users")
        .select("*")
        .or(`name.ilike.%${q}%,mobile.ilike.%${q}%`)
        .order("seq", { ascending: true })
        .limit(500);
      if (error) throw error;
      const filtered = user_type ? data?.filter((r:any)=>r.user_type===user_type) : data;
      return NextResponse.json({ users: filtered || [] });
    }

    if (user_type) {
      const { data, error } = await supabaseServer.from("users").select("*").eq("user_type", user_type).order("seq", { ascending: true }).limit(500);
      if (error) throw error;
      return NextResponse.json({ users: data || [] });
    }

    const { data, error } = await supabaseServer.from("users").select("*").order("seq", { ascending: true }).limit(500);
    if (error) throw error;
    return NextResponse.json({ users: data || [] });
  } catch (err:any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, user_type, mobile, password } = body;
    if (!name || !password) {
      return NextResponse.json({ message: "name and password required" }, { status: 400 });
    }

    // 1) find current max seq
    const { data: maxRow, error: maxError } = await supabaseServer
      .rpc("max_users_seq"); // we'll add a simple rpc or fallback below

    // fallback if rpc not available: simple select max(seq)
    let nextSeq = 1;
    try {
      const { data: rows, error } = await supabaseServer.from("users").select("seq").order("seq", { ascending: false }).limit(1);
      if (!error && rows && rows.length>0 && rows[0].seq) {
        nextSeq = Number(rows[0].seq) + 1;
      }
    } catch(e){ /* ignore */ }

    const hashed = await bcrypt.hash(password, 10);

    const insertObj = {
      name, user_type, mobile,
      password_hash: hashed,
      status: true,
      seq: nextSeq,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer.from("users").insert([insertObj]).select().single();
    if (error) throw error;
    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err:any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}
