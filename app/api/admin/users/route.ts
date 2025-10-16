// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

// ✅ GET all users or filter by query
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userType = searchParams.get("user_type");
  const q = searchParams.get("q");

  let query = supabaseServer.from("users").select("*").order("created_at", { ascending: false });

  if (userType) query = query.eq("user_type", userType);
  if (q) {
    query = query.or(`name.ilike.%${q}%,mobile.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ users: data }, { status: 200 });
}

// ✅ POST - Add new user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mobile, password, user_type } = body;

    if (!name || !password)
      return NextResponse.json({ message: "Name and Password required" }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseServer
      .from("users")
      .insert([{ name, mobile, password: hash, user_type, status: true }])
      .select();

    if (error) throw error;
    return NextResponse.json({ user: data?.[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
