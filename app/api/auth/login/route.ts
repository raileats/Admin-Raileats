// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { phone, password } = await req.json();
  if (phone === "8799726485" && password === "admin123") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: "admin_auth",
      value: "demo-token",
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24
    });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
