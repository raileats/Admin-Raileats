// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

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
    return makeLogoutResponse(req.url);
  } catch (err: any) {
    console.error("Logout POST error:", err);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    return makeLogoutResponse(req.url);
  } catch (err: any) {
    console.error("Logout GET error:", err);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
