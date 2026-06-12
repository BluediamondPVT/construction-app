// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === "/login" || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (path.startsWith("/dashboard") || path.startsWith("/api")) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret",
      );
      const { payload } = await jose.jwtVerify(token, secret);
      const role = payload.role as string;

      // 🚀 STRICT ROLE ISOLATION: Checking "Super" AND "Admin"
      if (
        path.startsWith("/dashboard/super-admin") &&
        !(role.includes("Admin") || role.includes("Super"))
      ) {
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
      if (
        path.startsWith("/dashboard/accounts") &&
        !role.includes("Accounts")
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (
        path.startsWith("/dashboard/purchase") &&
        !role.includes("Purchase")
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (path.startsWith("/dashboard/crm") && !role.includes("CRM")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
};
