// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const body = await req.json();
    // allow updates: name, user_type, mobile, status, email, dob, photo_url, password (optional)
    const { name, user_type, mobile, status, email, dob, photo_url, password } = body as any;

    const updateObj: any = {};
    if (typeof name !== "undefined") updateObj.name = name;
    if (typeof user_type !== "undefined") updateObj.user_type = user_type;
    if (typeof mobile !== "undefined") updateObj.mobile = mobile;
    if (typeof status !== "undefined") updateObj.status = status;
    if (typeof email !== "undefined") updateObj.email = email ?? null;
    if (typeof dob !== "undefined") updateObj.dob = dob ?? null;
    if (typeof photo_url !== "undefined") updateObj.photo_url = photo_url ?? null;

    // handle password only if provided (hash it)
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      updateObj.password_hash = password_hash;
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("users")
      .update(updateObj)
      .eq("id", id)
      .select("id, seq, user_id, name, user_type, mobile, email, dob, photo_url, status, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}

// Optionally, export GET for reading single user (if desired)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { data, error } = await supabaseServer
      .from("users")
      .select("id, seq, user_id, name, user_type, mobile, email, dob, photo_url, status, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/users/[id] error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}
