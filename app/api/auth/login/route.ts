// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serviceClient } from "@/lib/supabaseServer"; // adjust import if different

const COOKIE_NAME = "admin_auth";
const TOKEN_EXP_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.identifier ?? body.user_id ?? body.email ?? "").toString().trim();
    const password = (body.password ?? "").toString();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Find user by email OR mobile. Adjust column names as needed.
    // If your DB stores password hash in a different column, update 'password_hash'.
    const q = await serviceClient
      .from("users")
      .select("id, user_id, name, email, mobile, password_hash") // <-- ensure password_hash exists
      .or(`email.eq.${identifier},mobile.eq.${identifier}`)
      .limit(1)
      .single();

    if (q.error || !q.data) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = q.data as any;
    const hash = user.password_hash ?? user.password; // try both common names

    if (!hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Compare password
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create a signed token (JWT). Make sure ADMIN_JWT_SECRET set in env on Vercel.
    const secret = process.env.ADMIN_JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      console.error("Missing ADMIN_JWT_SECRET env var");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const token = jwt.sign(
      {
        uid: user.id,
        email: user.email,
        name: user.name,
        user_id: user.user_id,
      },
      secret,
      { expiresIn: `${TOKEN_EXP_SECONDS}s` }
    );

    // Return redirect and set cookie
    const res = NextResponse.redirect(new URL("/admin", request.url));
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TOKEN_EXP_SECONDS,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
