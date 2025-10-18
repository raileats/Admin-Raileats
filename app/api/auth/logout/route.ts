// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabaseServer"; // optional: will be ignored if not present

function makeLogoutResponse(requestUrl: string) {
  const redirectUrl = new URL("/admin/login", requestUrl);
  const res = NextResponse.redirect(redirectUrl);

  // Clear cookie by setting empty value + maxAge: 0
  // Keep same flags as set during login (httpOnly, secure in prod, path=/)
  res.cookies.set({
    name: "admin_auth",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });

  return res;
}

export async function POST(req: Request) {
  try {
    // If you used Supabase sessions and want to revoke them server-side, attempt it:
    try {
      const supa = getServerClient?.();
      if (supa?.auth) {
        // If the server client supports signOut or revoke, call signOut (best-effort)
        // For supabase-js v2, server signOut isn't typically necessary when using custom JWT,
        // but this call won't break if not supported.
        await supa.auth.signOut().catch(() => {});
      }
    } catch (e) {
      // ignore supabase signOut errors — still continue with cookie clearing
      console.warn("Supabase signOut (optional) failed:", e);
    }

    return makeLogoutResponse(req.url);
  } catch (err: any) {
    console.error("Logout POST error:", err);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // same behaviour for GET
    try {
      const supa = getServerClient?.();
      if (supa?.auth) {
        await supa.auth.signOut().catch(() => {});
      }
    } catch (e) {}
    return makeLogoutResponse(req.url);
  } catch (err: any) {
    console.error("Logout GET error:", err);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
