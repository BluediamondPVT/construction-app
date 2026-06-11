// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Extract token from cookies
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";

  // If user is not logged in and trying to access protected routes
  if (!token && !isLoginPage && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Specify which routes middleware should run on
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};