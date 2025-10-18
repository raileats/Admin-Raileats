// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

export async function POST() {
  try {
    // Create a cookie-aware Supabase client
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies });

    // Sign out from Supabase (removes session server-side)
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Logout error:", err);
  }

  // Explicitly clear cookies in browser
  const res = NextResponse.json({ success: true });
  res.cookies.delete("sb-access-token", { path: "/" });
  res.cookies.delete("sb-refresh-token", { path: "/" });
  return res;
}

// Optional: Allow GET for direct logout via browser
export async function GET() {
  return await POST();
}
