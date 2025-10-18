// app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Returns the currently authenticated user profile (name, photo_url, email).
 * Uses the server-side supabase client so the session cookie is respected.
 */
export async function GET() {
  try {
    // read auth user from cookie (server supabase client)
    const { data: userData, error: userErr } = await supabaseServer.auth.getUser();
    if (userErr) {
      console.warn("supabase getUser error:", userErr);
      return NextResponse.json({ user: null }, { status: 200 });
    }
    const user = (userData as any)?.user ?? null;
    if (!user || !user.email) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // try to fetch details from your users table by email
    const { data, error } = await supabaseServer
      .from("users")
      .select("name,photo_url,email")
      .eq("email", user.email)
      .limit(1)
      .single();

    if (!error && data) {
      return NextResponse.json({
        user: {
          name: data.name ?? null,
          photo_url: data.photo_url ?? null,
          email: data.email ?? user.email,
        },
      });
    }

    // fallback to returning the auth user's email and metadata if users row not found
    return NextResponse.json({
      user: {
        name: (user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) ?? user.email,
        photo_url: (user.user_metadata && user.user_metadata.avatar_url) ?? null,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("/api/admin/me error:", err);
    return NextResponse.json({ user: null, message: err.message || String(err) }, { status: 500 });
  }
}
