// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

type ReqUserBody = {
  name?: string;
  user_type?: string;
  mobile?: string;
  password?: string;
  email?: string | null;
  dob?: string | null;
  photo_url?: string | null;
};

// ✅ GET - list users
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const user_type = url.searchParams.get("user_type") || "";

    // base selection - pick required columns
    const baseSelect = `id, seq, name, user_type, mobile, email, dob, photo_url, status, created_at, updated_at`;

    if (q) {
      const { data, error } = await supabaseServer
        .from("users")
        .select(baseSelect)
        .or(`name.ilike.%${q}%,mobile.ilike.%${q}%`)
        .order("seq", { ascending: true })
        .limit(500);
      if (error) throw error;
      const filtered = user_type ? data?.filter((r: any) => r.user_type === user_type) : data;
      return NextResponse.json({ users: filtered || [] });
    }

    if (user_type) {
      const { data, error } = await supabaseServer
        .from("users")
        .select(baseSelect)
        .eq("user_type", user_type)
        .order("seq", { ascending: true })
        .limit(500);
      if (error) throw error;
      return NextResponse.json({ users: data || [] });
    }

    const { data, error } = await supabaseServer
      .from("users")
      .select(baseSelect)
      .order("seq", { ascending: true })
      .limit(500);
    if (error) throw error;
    return NextResponse.json({ users: data || [] });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}

// ✅ POST - add user (server-side hash -> password_hash)
export async function POST(request: Request) {
  try {
    const body: ReqUserBody = await request.json();
    const { name, user_type, mobile, password, email, dob, photo_url } = body;

    if (!name || !password) {
      return NextResponse.json(
        { message: "name and password required" },
        { status: 400 }
      );
    }

    // hash password into password_hash column
    const password_hash = await bcrypt.hash(password, 10);

    // Build insert object — DO NOT set seq here. Let DB sequence/default handle it.
    const insertObj: any = {
      name,
      user_type,
      mobile,
      password_hash,   // <-- use password_hash (NOT `password`)
      status: true,
      email: email ?? null,
      dob: dob ?? null,
      photo_url: photo_url ?? null
    };

    const { data, error } = await supabaseServer
      .from("users")
      .insert([insertObj])
      // request useful columns back, including seq assigned by DB
      .select("id, seq, name, user_type, mobile, email, dob, photo_url, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json(
      { message: err.message || String(err) },
      { status: 500 }
    );
  }
}
