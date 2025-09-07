// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (String(phone) === "8799726485" && String(password) === "admin123") {
      const res = NextResponse.json({ ok: true });
      res.cookies.set({
        name: "admin_auth",
        value: "demo-token-1",
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24,
        // secure: true, // enable in production (HTTPS)
        // sameSite: 'lax'
      });
      return res;
    }

    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
}
