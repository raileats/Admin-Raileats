// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

/**
 * GET -> /api/admin/users?q=...&user_type=...
 * POST -> create user (JSON body: { name, user_type, mobile, password })
 */

// GET
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const user_type = url.searchParams.get("user_type") || "Super Admin";

    let query = supabaseServer
      .from("users")
      .select("id,user_type,name,mobile,photo_url,status,created_at,updated_at")
      .eq("user_type", user_type);

    if (q) {
      // search name or mobile (case-insensitive)
      query = query.or(`name.ilike.%${q}%,mobile.ilike.%${q}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase GET users error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/users failed:", err);
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
}

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, user_type = "Super Admin", mobile = "", password } = body ?? {};

    if (!name || !password) {
      return NextResponse.json({ message: "Name and password are required" }, { status: 400 });
    }

    // hash password
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(String(password), salt);

    const { data, error } = await supabaseServer
      .from("users")
      .insert([{ user_type, name, mobile, password_hash, status: true }])
      .select()
      .single();

    if (error) {
      console.error("Supabase INSERT user error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // return safe user object (no password_hash)
    const safeUser = {
      id: data.id,
      user_type: data.user_type,
      name: data.name,
      mobile: data.mobile,
      photo_url: data.photo_url,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/users failed:", err);
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
}
