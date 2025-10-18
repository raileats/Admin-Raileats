// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

/**
 * Simple logout: clear sb cookies so browser no longer has session tokens.
 * We intentionally avoid importing auth-helpers here to keep this route minimal
 * and prevent build-time API mismatches.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear Supabase auth cookies set by your login route
  res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });

  return res;
}

// Optional GET handler so visiting /api/auth/logout in browser also logs out
export async function GET() {
  return POST();
}
