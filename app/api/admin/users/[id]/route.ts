// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function PATCH(request: Request, { params }: any) {
  try {
    const id = params.id;
    const body = await request.json();
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.mobile !== undefined) updates.mobile = body.mobile;
    if (body.user_type !== undefined) updates.user_type = body.user_type;
    if (body.status !== undefined) updates.status = body.status;
    if (body.password) {
      updates.password_hash = await bcrypt.hash(body.password, 10);
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer.from("users").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ user: data });
  } catch (err:any) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ message: err.message || String(err) }, { status: 500 });
  }
}
