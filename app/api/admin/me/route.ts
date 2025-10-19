// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { getServerClient, serviceClient } from "@/lib/supabaseServer";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ""
  );
}

export async function GET() {
  try {
    // 1) Try Supabase cookie-based auth first (reads sb-access-token / sb-refresh-token cookies)
    const supa = getServerClient();
    const { data: authData, error: authErr } = await supa.auth.getUser();
    if (!authErr && authData?.user) {
      // Found supabase auth user
      const email = authData.user.email ?? null;
      if (email) {
        const { data: row, error: rowErr } = await serviceClient
          .from("users")
          .select("id, user_id, user_type, name, mobile, photo_url, dob, email, status, created_at, updated_at, seq")
          .eq("email", email)
          .limit(1)
          .single();

        if (!rowErr && row) return NextResponse.json({ user: row });
        // If Supabase user exists but no row found, continue to try JWT fallback (rare)
      }
    }

    // 2) Fallback: try admin_auth JWT cookie
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get("admin_auth")?.value;
    if (!tokenCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const secret = getJwtSecret();
    if (!secret) {
      console.error("Missing JWT secret env var for admin_auth verification.");
      return NextResponse.json({ user: null }, { status: 500 });
    }

    let payload: any = null;
    try {
      payload = jwt.verify(tokenCookie, secret) as any;
    } catch (err) {
      console.warn("admin_auth JWT verify failed:", err);
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Payload expected to contain at least email or mobile or uid or user_id
    const email = payload.email ?? null;
    const mobile = payload.mobile ?? null;
    const uid = payload.uid ?? null;
    const user_id = payload.user_id ?? null;

    // Query users table by best available identifier
    let q = serviceClient.from("users").select("id, user_id, user_type, name, mobile, photo_url, dob, email, status, created_at, updated_at, seq").limit(1);
    if (email) q = q.eq("email", email);
    else if (mobile) q = q.eq("mobile", mobile);
    else if (user_id) q = q.eq("user_id", user_id);
    else if (uid) q = q.eq("id", uid);

    const { data: row, error: rowErr } = await q.single();
    if (rowErr || !row) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: row });
  } catch (err: any) {
    console.error("GET /api/admin/me error:", err);
    return NextResponse.json({ user: null, message: err.message || "Server error" }, { status: 500 });
  }
}
