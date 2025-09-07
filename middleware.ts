// middleware.ts (at repo root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // allow internals, api and login page
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  // protect admin routes
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const token = req.cookies.get("admin_auth")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
