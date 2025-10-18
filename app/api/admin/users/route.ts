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

    const baseSelect = `id, seq, user_id, name, user_type, mobile, email, dob, photo_url, status, created_at, updated_at`;

    let query = supabaseServer.from("users").select(baseSelect).order("seq", { ascending: true });

    if (q) {
      const { data, error } = await query.or(`name.ilike.%${q}%,mobile.ilike.%${q}%`);
      if (error) throw error;
      const filtered = user_type ? data?.filter((r: any) => r.user_type === user_type) : data;
      return NextResponse.json({ users: filtered || [] });
    }

    if (user_type) {
      const { data, error } = await query.eq("user_type", user_type);
      if (error) throw error;
      return NextResponse.json({ users: data || [] });
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ users: data || [] });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}

// ✅ POST - add user (server-side hash -> password_hash + auto user_id)
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

    // 🔹 Step 1 — Generate next user_id
    let nextUserId = 101; // default start
    const { data: rows, error: userErr } = await supabaseServer
      .from("users")
      .select("user_id")
      .order("user_id", { ascending: false })
      .limit(1);

    if (!userErr && rows && rows.length > 0 && rows[0].user_id) {
      const last = parseInt(rows[0].user_id, 10);
      if (!isNaN(last)) nextUserId = last + 1;
    }

    // 🔹 Step 2 — Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 🔹 Step 3 — Prepare insert object
    const insertObj: any = {
      name,
      user_type,
      mobile,
      password_hash,
      status: true,
      email: email ?? null,
      dob: dob ?? null,
      photo_url: photo_url ?? null,
      user_id: nextUserId.toString(), // auto increment user_id
    };

    // 🔹 Step 4 — Insert (let DB handle seq auto)
    const { data, error } = await supabaseServer
      .from("users")
      .insert([insertObj])
      .select("id, seq, user_id, name, user_type, mobile, email, dob, photo_url, created_at")
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
