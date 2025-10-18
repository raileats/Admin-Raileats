// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

// Helper to clear admin_auth cookie and create a redirect response
function clearCookieAndRedirect(requestUrl: string) {
  const redirectUrl = new URL("/admin/login", requestUrl);
  const res = NextResponse.redirect(redirectUrl);

  // Clear cookie by setting empty value + maxAge: 0 (same flags as login)
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

// When logged out via GET (clicking a link) — follow redirect automatically in browser
export async function GET(req: Request) {
  try {
    return clearCookieAndRedirect(req.url);
  } catch (err: any) {
    console.error("Logout GET error:", err);
    return NextResponse.json({ ok: false, message: "Logout failed" }, { status: 500 });
  }
}

// When using fetch() (client JS) the fetch won't auto-follow 302 in a way that changes window.location.
// So for POST we return JSON instructing client to redirect.
export async function POST(req: Request) {
  try {
    // clear cookie (same as GET)
    const res = new NextResponse(JSON.stringify({ ok: true, redirect: "/admin/login" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

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
  } catch (err: any) {
    console.error("Logout POST error:", err);
    return NextResponse.json({ ok: false, message: "Logout failed" }, { status: 500 });
  }
}
