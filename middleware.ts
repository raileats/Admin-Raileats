import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect admin paths except the login page and assets
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("admin_auth")?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    // optionally verify token here (JWT)
  }
  return NextResponse.next();
}

// apply to admin paths
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
