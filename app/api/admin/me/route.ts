// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer";

/**
 * GET /api/admin/me
 * - Reads sb-access-token / sb-refresh-token cookies (via getServerClient())
 * - Calls Supabase auth.getUser() to validate session
 * - Looks up users table (by email) and returns public fields
 *
 * Response: { user: { id, user_id, name, email, photo_url, user_type, mobile, dob, status, created_at, updated_at, seq } }
 */

export async function GET() {
  try {
    const client = getServerClient();

    // get authenticated user from supabase auth
    const { data: authData, error: authErr } = await client.auth.getUser();

    if (authErr || !authData?.user) {
      return NextResponse.json({ user: null, message: "Not signed in" }, { status: 401 });
    }

    const email = authData.user.email;
    if (!email) {
      return NextResponse.json({ user: null, message: "No email on session" }, { status: 400 });
    }

    // lookup users table by email (only select public fields)
    const { data: users, error } = await client
      .from("users")
      .select("id, seq, user_id, name, user_type, mobile, email, dob, photo_url, status, created_at, updated_at")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("me lookup error:", error);
      return NextResponse.json({ user: null, message: "Lookup failed" }, { status: 500 });
    }

    // If users table doesn't have the row, still return auth basic info
    const resultUser = users ?? {
      id: authData.user.id,
      name: authData.user.user_metadata?.full_name ?? authData.user.email,
      email: authData.user.email,
      photo_url: authData.user.user_metadata?.avatar_url ?? null,
    };

    return NextResponse.json({ user: resultUser });
  } catch (err: any) {
    console.error("GET /api/admin/me error:", err);
    return NextResponse.json({ user: null, message: err.message || "Server error" }, { status: 500 });
  }
}
