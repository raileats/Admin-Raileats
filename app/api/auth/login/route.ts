// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { serviceClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { mobile, password } = body || {};

    // Validation
    if (!mobile || !password) {
      return NextResponse.json(
        { message: "Mobile and password required" },
        { status: 400 }
      );
    }

    // 1️⃣ Find user by mobile
    const { data: user, error } = await serviceClient
      .from("users")
      .select("*")
      .eq("mobile", String(mobile))
      .single();

    if (error || !user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 2️⃣ Compare password hash
    const isValid = await bcrypt.compare(password, user.password_hash || "");
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 3️⃣ Return success response
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        user_type: user.user_type,
      },
    });
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
