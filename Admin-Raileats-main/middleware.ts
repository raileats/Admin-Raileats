import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;

  // Allow public assets and the login page
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_auth")?.value;
    if (!token) {
      // redirect to login
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Apply middleware to admin routes only
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
