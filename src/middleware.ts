// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Allow Public Routes (Login and Auth APIs)
  if (path === "/login" || path === "/api/auth/login" || path === "/api/auth/logout") {
    return NextResponse.next();
  }

  // 2. Protect Dashboard & Other APIs
  if (path.startsWith("/dashboard") || path.startsWith("/api")) {
    const token = request.cookies.get("auth_token")?.value;

    // 🚀 THE FIX: Smart Helper Function to handle API vs Page
    const handleUnauthorized = () => {
      if (path.startsWith("/api")) {
        // Agar API call hai, toh JSON error bhejo (Taki '<' html parse error na aaye)
        return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
      }
      // Agar direct page pe aaya hai, toh Login pe phek do
      return NextResponse.redirect(new URL("/login", request.url));
    };

    if (!token) {
      return handleUnauthorized();
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
      const { payload } = await jose.jwtVerify(token, secret);
      const role = payload.role as string;

      // -------------------------------------------------------------
      // STRICT ROLE ISOLATION
      // -------------------------------------------------------------
      if (path.startsWith("/dashboard/super-admin") && !(role.includes("Admin") || role.includes("Super"))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/hr") && !role.includes("HR")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/store") && !role.includes("Store")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/project") && !role.includes("Project")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/accounts") && !role.includes("Accounts")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/marketing") && !role.includes("Marketing")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/design") && !role.includes("Design")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      const response = handleUnauthorized();
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
};
