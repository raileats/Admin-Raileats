// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password)
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });

    // check user in DB
    const { data: userRow, error } = await supabase
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

    // now use supabaseServer to set auth cookie
    const {
      data: { session },
      error: signInError,
    } = await supabaseServer.auth.signInWithPassword({ email, password });

    if (signInError || !session) {
      console.error("SignIn error:", signInError);
      return NextResponse.json({ message: "Failed to start session" }, { status: 500 });
    }

    // set auth cookie
    const res = NextResponse.json({
      message: "Login successful",
      user: { name: userRow.name, email: userRow.email, photo_url: userRow.photo_url },
    });

    const access_token = session.access_token;
    const refresh_token = session.refresh_token;
    res.cookies.set("sb-access-token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    res.cookies.set("sb-refresh-token", refresh_token, {
      httpOnly: true,
      secure: true,
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
