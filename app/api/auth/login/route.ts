// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 1️⃣ Regular server-side client (service role) to read user table
const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// 2️⃣ Auth cookie-aware client (for sign-in and cookie setting)
function getServerClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies });
}

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

    // 🔍 Check credentials in your users table
    const { data: userRow, error } = await serviceClient
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1)
      .single();

    if (error || !userRow)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, userRow.password_hash);
    if (!valid)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });

    // ✅ Now sign in using a cookie-aware Supabase server client (not service role)
    const supabase = getServerClient();
    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !session) {
      console.error("SignIn error:", signInError);
      return NextResponse.json(
        { message: "Failed to start session" },
        { status: 500 }
      );
    }

    // 🍪 NextResponse from auth-helpers automatically writes cookies via createServerClient
    const res = NextResponse.json({
      message: "Login successful",
      user: {
        name: userRow.name,
        email: userRow.email,
        photo_url: userRow.photo_url,
      },
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
