// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.redirect("/admin/login");
  // clear supabase cookies
  res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
  return res;
}

// allow GET as convenience (redirect to login)
export async function GET() {
  return await POST();
}
