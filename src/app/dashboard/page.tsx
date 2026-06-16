// src/app/dashboard/page.tsx
import { cookies } from "next/headers";
import * as jose from "jose";
import { redirect } from "next/navigation";

export default async function DashboardRootRedirect() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let targetRoute = "/login";

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const roleName = payload.role as string;

    // 🚀 DYNAMIC FIX: Now checks for both "Super" and "Admin"
    if (roleName.includes("Super") || roleName.includes("Admin")) {
      targetRoute = "/dashboard/super-admin";
    } else if (roleName.includes("Store")) {
      targetRoute = "/dashboard/store";
    } else if (roleName.includes("HR")) {
      targetRoute = "/dashboard/hr";
    } else if (roleName.includes("Project")) {
      targetRoute = "/dashboard/project";
    } else if (roleName.includes("Accounts")) {
      targetRoute = "/dashboard/accounts";
    } else if (roleName.includes("Marketing")) {
      targetRoute = "/dashboard/marketing";
    } else if (roleName.includes("Design")) {
      targetRoute = "/dashboard/design"; 
    }
  } catch (error) {
    console.error("Token verification failed:", error);
  }

  redirect(targetRoute);
}