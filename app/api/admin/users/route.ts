// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get("user_type");
    const q = searchParams.get("q");

    let builder = supabaseServer.from("users").select("*").order("created_at", { ascending: false });

    if (userType) builder = builder.eq("user_type", userType);
    if (q) {
      // simple ilike search on name or mobile
      builder = builder.or(`name.ilike.%${q}%,mobile.ilike.%${q}%`);
    }

    const { data, error } = await builder;
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });

    return NextResponse.json({ users: data ?? [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mobile, password, user_type, photo_url } = body;

    if (!name || !password) {
      return NextResponse.json({ message: "name and password required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseServer
      .from("users")
      .insert([{ name, mobile, password: hashed, user_type: user_type ?? "Admin", photo_url, status: true }])
      .select();

    if (error) throw error;

    return NextResponse.json({ user: data?.[0] ?? null }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to create user" }, { status: 500 });
  }
}
