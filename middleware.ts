// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/_next") || p.startsWith("/api") || p === "/admin/login") return NextResponse.next();

  if (p === "/admin" || p.startsWith("/admin/")) {
    const token = req.cookies.get("admin_auth")?.value;
    if (!token) {
      const url = req.nextUrl.clone(); url.pathname = "/admin/login"; return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/admin"] };
