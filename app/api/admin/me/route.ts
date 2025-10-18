// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { getServerClient, serviceClient } from "@/lib/supabaseServer";

/**
 * GET /api/admin/me
 * - Reads cookies (sb-access-token / sb-refresh-token) via getServerClient()
 * - Uses Supabase auth to get current auth user
 * - Looks up users table for profile data (by email)
 *
 * Response (successful):
 * { ok: true, user: { id, name, email, photo_url, mobile, user_type, ... } }
 *
 * If not signed in:
 * { ok: false }
 */

export async function GET() {
  try {
    const supabase = getServerClient();

    // get current auth user from session (client was initialised with cookie tokens)
    const { data: authData, error: authErr } = await supabase.auth.getUser();

    if (authErr) {
      console.error("supabase.auth.getUser error:", authErr);
      // treat as not signed in
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const authUser = authData?.user ?? null;
    if (!authUser || !authUser.email) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const email = authUser.email;

    // read profile from your users table (use service client so RLS doesn't block)
    const { data: profile, error: profileErr } = await serviceClient
      .from("users")
      .select("id, user_id, name, email, photo_url, mobile, user_type, status")
      .eq("email", String(email))
      .limit(1)
      .maybeSingle();

    if (profileErr) {
      console.error("error fetching users row:", profileErr);
      // still return auth basic info if profile not found
      return NextResponse.json({
        ok: true,
        user: {
          id: authUser.id,
          email: authUser.email,
          photo_url: authUser.user_metadata?.avatar_url ?? authUser.user_metadata?.avatar ?? null,
        },
      });
    }

    // build returned user object (prefer profile fields if present)
    const user = {
      id: profile?.id ?? authUser.id,
      user_id: profile?.user_id ?? null,
      name: profile?.name ?? authUser.user_metadata?.name ?? null,
      email: profile?.email ?? authUser.email,
      photo_url: profile?.photo_url ?? authUser.user_metadata?.avatar_url ?? null,
      mobile: profile?.mobile ?? null,
      user_type: profile?.user_type ?? null,
      status: profile?.status ?? null,
    };

    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    console.error("GET /api/admin/me error:", err);
    return NextResponse.json({ ok: false, message: err?.message ?? "Server error" }, { status: 500 });
  }
}
