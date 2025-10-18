// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { getServerClient, serviceClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // cookie-aware anonymous client (reads sb-access-token / sb-refresh-token cookies)
    const supa = getServerClient();

    // get supabase auth user (from cookie)
    const { data: authData, error: authErr } = await supa.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const email = authData.user.email;
    if (!email) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // fetch the full user row from your users table using service role client
    const { data: row, error: rowErr } = await serviceClient
      .from("users")
      .select("id, user_id, user_type, name, mobile, photo_url, dob, email, status, created_at, updated_at, seq")
      .eq("email", email)
      .limit(1)
      .single();

    if (rowErr || !row) {
      // user not found in users table
      return NextResponse.json({ user: null }, { status: 404 });
    }

    // return user row
    return NextResponse.json({ user: row });
  } catch (err: any) {
    console.error("GET /api/admin/me error:", err);
    return NextResponse.json({ user: null, message: err.message || "Server error" }, { status: 500 });
  }
}
