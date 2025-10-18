// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Missing SUPABASE env vars");
}

// service client for reading users table securely
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// anon client (can call signInWithPassword)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password)
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });

    // verify credentials against your users table using service client
    const { data: userRow, error } = await serviceClient
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1)
      .single();

    if (error || !userRow) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // sign in with anon client to obtain session tokens
    const { data, error: signInErr } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !data?.session) {
      console.error("signIn error:", signInErr);
      return NextResponse.json({ message: "Failed to start session" }, { status: 500 });
    }

    const session = data.session;

    // create response and set sb cookies manually so browser sends them on later requests
    const res = NextResponse.json({
      message: "Login successful",
      user: { name: userRow.name, email: userRow.email, photo_url: userRow.photo_url },
    });

    // set cookies (httpOnly) — adjust options as needed
    res.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // set expiry same as session.expires_at if available
    });
    res.cookies.set("sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json({ message: err.message || "Server error" }, { status: 500 });
  }
}
