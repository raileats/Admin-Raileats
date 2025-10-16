// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

// ✅ PATCH - Update user by ID
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { name, mobile, user_type, password, status } = body;

    const updateData: any = { name, mobile, user_type, status };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer.from("users").update(updateData).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
