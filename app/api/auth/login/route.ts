// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serviceClient } from "@/lib/supabaseServer";

const COOKIE_NAME = "admin_auth";
const TOKEN_EXP_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ""
  );
}

async function parseBody(req: Request) {
  // Try JSON first, then formData (for plain <form> submits)
  try {
    const json = await req.json();
    return json;
  } catch (_) {
    try {
      const fd = await req.formData();
      const obj: Record<string, any> = {};
      for (const [k, v] of fd.entries()) {
        obj[k] = typeof v === "string" ? v : v;
      }
      return obj;
    } catch (_) {
      return {};
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = (await parseBody(req)) || {};
    const mobile = (body.mobile ?? body.identifier ?? body.user_id ?? "").toString().trim();
    const password = (body.password ?? "").toString();

    if (!mobile || !password) {
      return NextResponse.json({ message: "Mobile and password required" }, { status: 400 });
    }

    // Find user by mobile
    const { data: user, error } = await serviceClient
      .from("users")
      .select("*")
      .eq("mobile", String(mobile))
      .single();

    if (error || !user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Compare password hash
    const hash = user.password_hash ?? user.password ?? "";
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Build JWT payload (keep minimal)
    const payload = {
      uid: user.id,
      user_id: user.user_id ?? null,
      mobile: user.mobile ?? null,
      email: user.email ?? null,
      name: user.name ?? null,
      iat: Math.floor(Date.now() / 1000),
    };

    const secret = getJwtSecret();
    if (!secret) {
      console.error("Missing JWT secret env var. Set ADMIN_JWT_SECRET or NEXTAUTH_SECRET.");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    const token = jwt.sign(payload, secret, { expiresIn: TOKEN_EXP_SECONDS });

    // Set cookie and redirect to /admin
    const res = NextResponse.redirect(new URL("/admin", req.url));
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
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 });
  }
}
