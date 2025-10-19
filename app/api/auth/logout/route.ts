// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

/**
 * Handles both GET (redirect logout) and POST (AJAX logout).
 * Clears all relevant auth cookies: admin_auth + Supabase cookies.
 */

const ADMIN_COOKIE = "admin_auth";
const SB_ACCESS = "sb-access-token";
const SB_REFRESH = "sb-refresh-token";

function clearCookie(res: NextResponse, name: string) {
  res.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    sameSite: "lax",
  });
}

export async function GET(req: Request) {
  try {
    const redirectUrl = new URL("/admin/login", req.url);
    const res = NextResponse.redirect(redirectUrl);

    // Clear all cookies (admin + supabase)
    clearCookie(res, ADMIN_COOKIE);
    clearCookie(res, SB_ACCESS);
    clearCookie(res, SB_REFRESH);

    return res;
  } catch (err: any) {
    console.error("Logout GET error:", err);
    return NextResponse.json({ ok: false, message: "Logout failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const res = new NextResponse(
      JSON.stringify({ ok: true, redirect: "/admin/login" }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );

    // Clear all cookies (admin + supabase)
    clearCookie(res, ADMIN_COOKIE);
    clearCookie(res, SB_ACCESS);
    clearCookie(res, SB_REFRESH);

    return res;
  } catch (err: any) {
    console.error("Logout POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Logout failed" },
      { status: 500 }
    );
  }
}
