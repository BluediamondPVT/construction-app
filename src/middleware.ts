// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

/**
 * Decodes the JWT token payload without signature verification.
 * Can be used as a lightweight approach or fallback.
 */
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Verifies the JWT token and returns the payload using jose.
 */
async function verifyAndDecodeToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    // If verification fails but token payload is needed/analyzed, we could fall back to decodeJwtPayload(token).
    // However, to maintain strict security, return null if verification fails.
    return null;
  }
}

/**
 * Helper to determine the authorized dashboard path based on the user's role.
 */
function getAuthorizedPathForRole(role: string): string {
  const roleName = role || "";
  if (roleName.includes("Super") || roleName.includes("Admin")) {
    return "/dashboard/super-admin";
  }
  if (roleName.includes("HR")) {
    return "/dashboard/hr";
  }
  if (roleName.includes("Store")) {
    return "/dashboard/store";
  }
  if (roleName.includes("Project")) {
    return "/dashboard/project";
  }
  if (roleName.includes("Accounts")) {
    return "/dashboard/accounts";
  }
  if (roleName.includes("Marketing")) {
    return "/dashboard/marketing";
  }
  if (roleName.includes("Design")) {
    return "/dashboard/design";
  }
  return "";
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("auth_token")?.value;

  // 1. Authentication & Route Isolation Check for Dashboard
  if (path.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyAndDecodeToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }

    const role = (payload.role as string) || "";
    const authorizedPath = getAuthorizedPathForRole(role);

    if (!authorizedPath) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }

    const isSuperAdmin = role === "Super Admin" || role.includes("Super") || role.includes("Admin");
    const isHRPath = path.startsWith("/dashboard/hr");

    if (isSuperAdmin && (path === "/dashboard" || isHRPath)) {
      return NextResponse.next(); // Allow Super Admin to access /dashboard and all HR paths
    }

    // Enforce strict boundaries: redirect if path does not match their assigned folder prefix
    const isAllowed = path === authorizedPath || path.startsWith(authorizedPath + "/");
    if (!isAllowed) {
      return NextResponse.redirect(new URL(authorizedPath, request.url));
    }

    return NextResponse.next();
  }

  // 2. Login Redirection for authenticated users visiting / or /login
  if (path === "/" || path === "/login") {
    if (token) {
      const payload = await verifyAndDecodeToken(token);
      if (payload) {
        const role = (payload.role as string) || "";
        const authorizedPath = getAuthorizedPathForRole(role);
        if (authorizedPath) {
          return NextResponse.redirect(new URL(authorizedPath, request.url));
        }
      }

      // Clear token if it was invalid or expired
      const response = NextResponse.next();
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
