// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

/**
 * GET  /api/auth/logout
 * Clears admin_auth cookie and redirects to /admin/login.
 * Used when user clicks a simple <a href="/api/auth/logout">Logout</a>
 *
 * POST /api/auth/logout
 * Same but returns JSON { ok: true, redirect: "/admin/login" } for fetch-based logout.
 */

function clearAuthCookie(res: NextResponse) {
  res.cookies.set({
    name: "admin_auth",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export async function GET(req: Request) {
  try {
    const redirectUrl = new URL("/admin/login", req.url);
    const res = NextResponse.redirect(redirectUrl);
    clearAuthCookie(res);
    return res;
  } catch (err: any) {
    console.error("Logout GET error:", err);
    return NextResponse.json({ ok: false, message: "Logout failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const res = new NextResponse(JSON.stringify({ ok: true, redirect: "/admin/login" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    clearAuthCookie(res);
    return res;
  } catch (err: any) {
    console.error("Logout POST error:", err);
    return NextResponse.json({ ok: false, message: "Logout failed" }, { status: 500 });
  }
}
