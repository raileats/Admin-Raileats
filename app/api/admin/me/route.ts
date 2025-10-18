// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const {
      data: { user: authUser },
      error: getUserErr,
    } = await supabaseServer.auth.getUser();

    if (getUserErr || !authUser || !authUser.email) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from("users")
      .select("name,photo_url,email")
      .eq("email", authUser.email)
      .limit(1)
      .single();

    if (!error && data) {
      return NextResponse.json({
        user: { name: data.name ?? null, photo_url: data.photo_url ?? null, email: data.email },
      });
    }

    // fallback to auth metadata
    return NextResponse.json({
      user: {
        name: (authUser.user_metadata && (authUser.user_metadata.name || authUser.user_metadata.full_name)) ?? authUser.email,
        photo_url: (authUser.user_metadata && authUser.user_metadata.avatar_url) ?? null,
        email: authUser.email,
      },
    });
  } catch (err: any) {
    console.error("/api/admin/me error:", err);
    return NextResponse.json({ user: null, message: err.message || String(err) }, { status: 500 });
  }
}
