// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "").trim();

    // Hard-coded credentials (demo)
    if (phone === "8799726485" && password === "admin123") {
      const res = NextResponse.json({ ok: true });

      // Set httpOnly cookie so middleware can read it server-side on next requests.
      // In production use secure: true and a signed token/JWT.
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
