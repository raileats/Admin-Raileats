// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    // demo credentials
    if (String(phone) === "8799726485" && String(password) === "admin123") {
      const res = NextResponse.json({ ok: true });

      // set httpOnly cookie for server-side middleware to read
      res.cookies.set({
        name: "admin_auth",
        value: "demo-token",
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 // 1 day
      });

      return res;
    }

    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
}
