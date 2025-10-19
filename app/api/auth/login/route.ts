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
 * Robust parser that prioritizes raw text (URL-encoded) first,
 * then JSON, then formData fallback. This order ensures application/x-www-form-urlencoded
 * bodies are parsed reliably in many hosting environments.
 */
async function parseBody(req: Request) {
  // 1) try raw text first (good for urlencoded)
  try {
    const text = await req.text();
    if (text && text.trim()) {
      // try urlencoded parsing
      try {
        const params = new URLSearchParams(text);
        if ([...params.keys()].length > 0) {
          const out: Record<string, any> = {};
          for (const [k, v] of params.entries()) out[k] = v;
          return out;
        }
      } catch (_) {
        // ignore
      }

      // try json parse of text
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (_) {
        // fallback to raw text
        return { raw: text };
      }
    }
  } catch (_) {
    // ignore and continue
  }

  // 2) try JSON (if body wasn't available as text earlier)
  try {
    const json = await req.json();
    if (json && typeof json === "object" && Object.keys(json).length > 0) {
      return json;
    }
  } catch (_) {}

  // 3) try formData (multipart/form-data)
  try {
    const fd = await req.formData();
    const obj: Record<string, any> = {};
    for (const [k, v] of fd.entries()) {
      obj[k] = typeof v === "string" ? v : v;
    }
    if (Object.keys(obj).length > 0) return obj;
  } catch (_) {}

  return {};
}

function maskValue(key: string, val: any) {
  if (val == null) return null;
  if (key.toLowerCase().includes("pass")) return "***";
  const s = String(val);
  if (s.length > 50) return s.slice(0, 50) + "...";
  return s;
}

export async function POST(req: Request) {
  try {
    const body = (await parseBody(req)) || {};

    const contentType = req.headers.get("content-type") || "unknown";
    const keys = Object.keys(body || {});
    const preview: Record<string, any> = {};
    for (const k of keys) preview[k] = maskValue(k, body[k]);

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
      console.warn("LOGIN DEBUG: missing credentials. content-type:", contentType);
      console.warn("LOGIN DEBUG: parsed body keys:", keys);
      console.warn("LOGIN DEBUG: preview:", preview);

      return NextResponse.json(
        {
          message: "Mobile and password required",
          debug: {
            contentType,
            parsedKeys: keys,
            parsedPreview: preview,
            note:
              "Fields expected: mobile OR email OR identifier OR identifier_raw OR user_id, and password. " +
              "If you submitted a native form, ensure input names match these and hidden inputs are present.",
          },
        },
        { status: 400 }
      );
    }

    // decide email or mobile
    let mobile = "";
    let email = "";
    if (rawIdentifier.includes("@")) email = rawIdentifier;
    else mobile = rawIdentifier;

    if (body.mobile) mobile = String(body.mobile).trim();
    if (body.email) email = String(body.email).trim();

    // Query DB
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
