// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { serviceClient, getServerClient } from "@/lib/supabaseServer";

/**
 * Login handler (uses Supabase auth-helpers)
 * - Validates user credentials from `users` table (via service client)
 * - Signs in with Supabase Auth (cookie-aware)
 * - Sets cookies automatically using auth-helpers
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 }
      );
    }

    // Step 1: Check user in your users table
    const { data: userRow, error } = await serviceClient
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1)
      .single();

    if (error || !userRow) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Step 2: Compare password hash
    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Step 3: Create a cookie-aware Supabase client
    const supabase = getServerClient();

    // Step 4: Sign in (auth-helpers will auto set cookies)
    const { data: signInData, error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signErr || !signInData?.session) {
      console.error("Sign-in error:", signErr);
      return NextResponse.json({ message: "Failed to start session" }, { status: 500 });
    }

    // Step 5: Respond with user details (cookies are already set)
    return NextResponse.json({
      message: "Login successful",
      user: {
        name: userRow.name,
        email: userRow.email,
        photo_url: userRow.photo_url,
      },
    });
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
