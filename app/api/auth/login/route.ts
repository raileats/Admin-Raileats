// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { serviceClient } from "@/lib/supabaseServer"; // ensure this is exported from your lib
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE env vars");
}

// anon client used only to call auth.signInWithPassword
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, mobile, password } = body || {};

    // require password and one of email/mobile
    if (!password || (!email && !mobile)) {
      return NextResponse.json(
        { message: "Email (or mobile) and password required" },
        { status: 400 }
      );
    }

    // If user provided mobile instead of email, look up the user row by mobile
    let userRow: any = null;
    if (!email && mobile) {
      const { data: rowByMobile, error: errMobile } = await serviceClient
        .from("users")
        .select("*")
        .eq("mobile", String(mobile))
        .limit(1)
        .single();

      if (errMobile || !rowByMobile) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }
      userRow = rowByMobile;
      // if users table doesn't have an email, we still need an email for supabase auth sign-in
      // if email missing, we will still attempt sign-in using stored email field (should exist)
      email = rowByMobile.email;
    } else {
      // we have email -> fetch user row by email
      const { data: rowByEmail, error: errEmail } = await serviceClient
        .from("users")
        .select("*")
        .eq("email", String(email))
        .limit(1)
        .single();

      if (errEmail || !rowByEmail) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }
      userRow = rowByEmail;
    }

    // password hash compare (users table should have password_hash)
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Sign in via anon client to obtain session tokens
    const { data: signInData, error: signErr } = await anonClient.auth.signInWithPassword({
      email: String(email),
      password,
    });

    if (signErr || !signInData?.session) {
      console.error("signIn error:", signErr);
      return NextResponse.json({ message: "Failed to start session" }, { status: 500 });
    }

    const session = signInData.session;

    // Create response and set httpOnly cookies so browser will send them on later requests
    const res = NextResponse.json({
      message: "Login successful",
      user: {
        name: userRow.name,
        email: userRow.email,
        photo_url: userRow.photo_url ?? null,
      },
    });

    const secure = process.env.NODE_ENV === "production";
    // set access token and refresh token as httpOnly cookies
    res.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      // optionally set maxAge using `expires_at` if available
    });
    res.cookies.set("sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
