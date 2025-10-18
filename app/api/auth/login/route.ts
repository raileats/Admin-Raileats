// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { serviceClient, createAnonClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Accept email OR mobile OR phone (phone used by your client)
    let { email, mobile, phone, password } = body || {};
    mobile = mobile ?? phone;

    if (!password || (!email && !mobile)) {
      return NextResponse.json(
        { message: "Email (or mobile) and password required" },
        { status: 400 }
      );
    }

    // 1) Find user row (by mobile OR email)
    let userRow: any = null;
    if (mobile && !email) {
      const { data: row, error } = await serviceClient
        .from("users")
        .select("*")
        .eq("mobile", String(mobile))
        .limit(1)
        .single();
      if (error || !row) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }
      userRow = row;
      email = row.email; // ensure we have email for Supabase sign-in
    } else {
      const { data: row, error } = await serviceClient
        .from("users")
        .select("*")
        .eq("email", String(email))
        .limit(1)
        .single();
      if (error || !row) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }
      userRow = row;
    }

    // 2) Compare password against stored hash
    if (!userRow.password_hash) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 3) Sign in with Supabase (anon client) to get session tokens
    const anonClient = createAnonClient();
    const { data: signInData, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: String(email),
      password,
    });

    if (signInErr) {
      console.error("Supabase signIn error:", signInErr);
      // if credentials wrong at supabase side, return 401
      return NextResponse.json(
        { message: signInErr.message || "Failed to start session" },
        { status: signInErr.status ?? 401 }
      );
    }

    if (!signInData?.session) {
      console.error("No session from Supabase signIn:", signInData);
      return NextResponse.json({ message: "Failed to start session" }, { status: 500 });
    }

    const session = signInData.session;

    // 4) Send response and set httpOnly cookies for session tokens
    const res = NextResponse.json({
      message: "Login successful",
      user: {
        name: userRow.name,
        email: userRow.email,
        photo_url: userRow.photo_url ?? null,
      },
    });

    const secure = process.env.NODE_ENV === "production";
    res.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
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
      { message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
