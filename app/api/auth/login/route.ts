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
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  // 1) application/x-www-form-urlencoded or multipart/form-data → formData()
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    try {
      const fd = await req.formData();
      const obj: Record<string, any> = {};
      for (const [k, v] of fd.entries()) obj[k] = typeof v === "string" ? v : v;
      if (Object.keys(obj).length > 0) return obj;
    } catch (_) {}
  }

  // 2) application/json → json()
  if (ct.includes("application/json")) {
    try {
      const json = await req.json();
      if (json && typeof json === "object") return json;
    } catch (_) {}
  }

  // 3) fallback: raw text (try urlencoded, then json)
  try {
    const text = await req.text();
    if (text && text.trim()) {
      try {
        const p = new URLSearchParams(text);
        const out: Record<string, any> = {};
        for (const [k, v] of p.entries()) out[k] = v;
        if (Object.keys(out).length > 0) return out;
      } catch (_) {}
      try {
        const j = JSON.parse(text);
        if (j && typeof j === "object") return j;
      } catch (_) {}
      return { raw: text };
    }
  } catch (_) {}

  return {};
}

export async function POST(req: Request) {
  try {
    const body = (await parseBody(req)) || {};

    // Accept multiple field names for identifier
    const rawIdentifier = (
      body.mobile ??
      body.email ??
      body.identifier ??
      body.identifier_raw ??
      body.user_id ??
      ""
    )
      .toString()
      .trim();

    const password = (body.password ?? "").toString();

    if (!rawIdentifier || !password) {
      return NextResponse.json({ message: "Mobile and password required" }, { status: 400 });
    }

    // Determine mobile/email
    let mobile = "";
    let email = "";
    if (rawIdentifier.includes("@")) email = rawIdentifier;
    else mobile = rawIdentifier;
    if (body.mobile) mobile = String(body.mobile).trim();
    if (body.email) email = String(body.email).trim();

    // Find user (prefer mobile)
    let query = serviceClient.from("users").select("*").limit(1);
    if (mobile) query = query.eq("mobile", mobile);
    else if (email) query = query.eq("email", email);
    else query = serviceClient.from("users").select("*").eq("user_id", rawIdentifier).limit(1);

    const { data: user, error } = await query.single();
    if (error || !user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const hash = user.password_hash ?? user.password ?? "";
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Sign JWT and set cookie
    const secret = getJwtSecret();
    if (!secret) {
      console.error("Missing JWT secret env var. Set ADMIN_JWT_SECRET or NEXTAUTH_SECRET.");
      return NextResponse.json({ message: "Server misconfiguration" }, { status: 500 });
    }

    const payload = {
      uid: user.id,
      user_id: user.user_id ?? null,
      mobile: user.mobile ?? null,
      email: user.email ?? null,
      name: user.name ?? null,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, secret, { expiresIn: TOKEN_EXP_SECONDS });

    const redirectUrl = new URL("/admin", req.url);

    // Use 303 so browser converts POST → GET to /admin (prevents hang/re-POST)
    const res = NextResponse.redirect(redirectUrl, { status: 303 });
    res.headers.set("Cache-Control", "no-store");
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
