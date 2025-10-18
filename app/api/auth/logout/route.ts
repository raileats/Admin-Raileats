// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // 🔹 Clear your auth cookie or Supabase session here
  // Example for cookie-based auth:
  const res = NextResponse.json({ success: true });
  res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
  return res;
}

// Optional: handle GET too (if someone directly visits /api/auth/logout)
export async function GET() {
  return await POST();
}
