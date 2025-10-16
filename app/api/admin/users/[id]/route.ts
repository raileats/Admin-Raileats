// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const body = await req.json();
    const { name, mobile, password, user_type, status, photo_url } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (user_type !== undefined) updateData.user_type = user_type;
    if (status !== undefined) updateData.status = status;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer.from("users").update(updateData).eq("id", id).select();

    if (error) throw error;

    return NextResponse.json({ success: true, user: data?.[0] ?? null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to update user" }, { status: 500 });
  }
}
