// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ message: "phone and password required" }, { status: 400 });
    }

    // Select both common column names just in case DB uses one or the other
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, mobile, password, password_hash, status, user_type")
      .eq("mobile", phone)
      .single();

    if (error || !user) {
      console.warn("Login: user not found for mobile:", phone, "supabase error:", error?.message);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (!user.status) {
      return NextResponse.json({ message: "User blocked. Contact Admin." }, { status: 403 });
    }

    // Determine which field holds the hash
    const hashCandidate = (user.password && String(user.password).trim()) || (user.password_hash && String(user.password_hash).trim()) || "";

    // Debug logs (server-side only)
    console.log(`[auth/login] mobile=${phone} userId=${user.id} hasHash=${!!hashCandidate}`);

    if (!hashCandidate) {
      // Helpful debugging message — you can remove in production
      console.warn(`[auth/login] No password hash present for user ${user.id} (mobile ${phone}).`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, hashCandidate);
    if (!match) {
      console.warn(`[auth/login] Password mismatch for user ${user.id} (mobile ${phone}).`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Login success — set cookie/session here if needed.
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
