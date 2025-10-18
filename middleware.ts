// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware:
 * - Always skip Next internals, static assets, API routes and the login page.
 * - Only protect /admin routes.
 * - If admin route and no admin_auth cookie present -> redirect to /admin/login.
 *
 * Important: checks for "/api" MUST run before any redirect logic to avoid loops/timeouts.
 */

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // 1) Skip Next internals & public/static & API immediately
  if (
    p.startsWith("/_next") ||
    p.startsWith("/api") ||
    p.startsWith("/static") ||
    p.startsWith("/public") ||
    p === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2) Allow the login page itself
  if (p === "/admin/login" || p.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // 3) Protect /admin and subpaths
  if (p === "/admin" || p.startsWith("/admin/")) {
    const token = req.cookies.get("admin_auth")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Default: allow
  return NextResponse.next();
}

// Only run middleware for /admin routes (this avoids executing middleware unnecessarily)
export const config = {
  matcher: ["/admin/:path*"],
};
