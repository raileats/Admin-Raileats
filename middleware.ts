// middleware.ts (root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // allow Next internals, public assets, API and the login page itself
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/admin/login" ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // protect all /admin routes
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const token = req.cookies.get("admin_auth")?.value;
    if (!token) {
      // not logged in -> redirect to login
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// only run middleware for admin paths
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
