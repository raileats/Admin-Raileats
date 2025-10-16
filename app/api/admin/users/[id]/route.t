// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const body = await req.json();
    const updates: any = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.user_type !== undefined) updates.user_type = body.user_type;
    if (body.mobile !== undefined) updates.mobile = body.mobile;
    if (body.status !== undefined) updates.status = body.status;
    if (body.photo_url !== undefined) updates.photo_url = body.photo_url;

    if (body.password) {
      const salt = bcrypt.genSaltSync(10);
      updates.password_hash = bcrypt.hashSync(String(body.password), salt);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase UPDATE user error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const safeUser = {
      id: data.id,
      name: data.name,
      user_type: data.user_type,
      mobile: data.mobile,
      photo_url: data.photo_url,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/users/[id] failed:", err);
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
}
