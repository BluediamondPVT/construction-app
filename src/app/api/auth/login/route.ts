// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Invalid credentials or disabled account" },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Role Fetching
    const role = await Role.findById(user.role);
    const roleName = role ? role.name : "Unknown";

    // 🚀 DYNAMIC REDIRECT LOGIC BASED ON ROLE
    let redirectUrl = "/dashboard";
    
    // 🚀 YAHAN FIX KIYA HAI: 'Super' word ko include check me daala hai
    if (roleName.includes("Super") || roleName.includes("Admin")) {
      redirectUrl = "/dashboard/super-admin";
    } else if (roleName.includes("Store")) {
      redirectUrl = "/dashboard/store";
    } else if (roleName.includes("HR")) {
      redirectUrl = "/dashboard/hr";
    } else if (roleName.includes("Project")) {
      redirectUrl = "/dashboard/project";
    } else if (roleName.includes("Accounts")) {
      redirectUrl = "/dashboard/accounts";
    } else if (roleName.includes("Marketing")) {
      redirectUrl = "/dashboard/marketing";
    } else if (roleName.includes("Design")) {
      redirectUrl = "/dashboard/design"; 
    }
    
    // JWT Creation
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret",
    );
    
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: roleName,
      // 🚀 THE FIX: Convert heavy Mongoose array to plain JavaScript array
      permissions: role && role.permissions ? Array.from(role.permissions) : [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    const response = NextResponse.json(
      { message: "Login successful", redirectUrl },
      { status: 200 },
    );

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}