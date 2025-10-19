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

/**
 * Parse request body in a robust way:
 * - Try JSON
 * - Then formData (native forms/multipart)
 * - Then raw text (try urlencoded or JSON)
 */
async function parseBody(req: Request) {
  // Try JSON
  try {
    const json = await req.json();
    if (json && typeof json === "object" && Object.keys(json).length > 0) {
      return json;
    }
  } catch (_) {}

  // Try formData
  try {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      obj[k] = typeof v === "string" ? v : v;
    }
    if (Object.keys(obj).length > 0) return obj;
  } catch (_) {}

  // Try raw text (urlencoded or JSON)
  try {
    const text = await req.text();
    if (text && text.trim()) {
      // urlencoded?
      try {
        const p = new URLSearchParams(text);
        if (p.toString()) {
          const out: Record<string, any> = {};
          for (const [k, v] of p.entries()) out[k] = v;
          return out;
        }
      } catch (_) {}
      // maybe JSON string
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (_) {}
      // fallback
      return { raw: text };
    }
  } catch (_) {}

  return {};
}

export async function POST(req: Request) {
  try {
    const body = (await parseBody(req)) || {};

    // Accept multiple identifier field names for maximum compatibility
    const rawIdentifier =
      (body.mobile ??
        body.email ??
        body.identifier ??
        body.identifier_raw ??
        body.user_id ??
        "")
        .toString()
        .trim();

    const password = (body.password ?? "").toString();

    if (!rawIdentifier || !password) {
      console.warn("Login attempt missing credentials. Parsed body:", body);
      return NextResponse.json({ message: "Mobile and password required" }, { status: 400 });
    }

    // Decide if identifier is email or mobile (but prefer explicit fields if provided)
    let mobile = "";
    let email = "";
    if (rawIdentifier.includes("@")) email = rawIdentifier;
    else mobile = rawIdentifier;

    if (body.mobile) mobile = String(body.mobile).trim();
    if (body.email) email = String(body.email).trim();

    // Query users table: prefer mobile, then email, then user_id fallback
    let query = serviceClient.from("users").select("*").limit(1);
    if (mobile) query = query.eq("mobile", mobile);
    else if (email) query = query.eq("email", email);
    else query = serviceClient.from("users").select("*").eq("user_id", rawIdentifier).limit(1);

    const { data: user, error } = await query.single();

    if (error || !user) {
      console.warn("Login failed - user not found for identifier:", rawIdentifier);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const hash = user.password_hash ?? user.password ?? "";
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      console.warn("Login failed - invalid password for user:", user.id);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

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

    // set cookie and redirect to /admin
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
