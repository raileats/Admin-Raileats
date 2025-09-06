// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    // Hard-coded check (demo). Replace with DB/secure check in prod.
    if (phone === "8799726485" && password === "admin123") {
      const res = NextResponse.json({ ok: true });

      // Set httpOnly cookie so middleware can read it server-side on next requests.
      // NOTE: NextResponse.cookies.set options differ by Next version; this is compatible with Next 13+.
      res.cookies.set({
        name: "admin_auth",
        value: "demo-token",          // in prod use signed JWT or session id
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24          // 1 day
        // secure: true,   // set in prod (requires HTTPS)
        // sameSite: 'lax'
      });

      return res;
    }

    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
}
