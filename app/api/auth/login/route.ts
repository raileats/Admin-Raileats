// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/auth/login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { message: "phone and password required" },
        { status: 400 }
      );
    }

    // fetch stored password_hash (not "password")
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, mobile, password_hash, status, user_type")
      .eq("mobile", phone)
      .single();

    if (error || !user) {
      // do not reveal whether user exists
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (user.status === false) {
      return NextResponse.json({ message: "User blocked. Contact Admin." }, { status: 403 });
    }

    // Compare password with stored hash
    const match = await bcrypt.compare(password, user.password_hash || "");
    if (!match) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Login success — create cookie/session/JWT here if you need
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ message: "Server error", error: String(err) }, { status: 500 });
  }
}
