import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Invalid credentials or account disabled" },
        { status: 401 }
      );
    }

    const userRole = await Role.findById(user.role);

    if (!userRole) {
      return NextResponse.json(
        { message: "Role mapping failed in database" },
        { status: 500 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const alg = "HS256";

    // FIX: Converted MongooseArray to a standard JavaScript Array using spread operator
    const token = await new SignJWT({
      userId: user._id.toString(),
      role: userRole.name,
      permissions: [...userRole.permissions], 
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    let redirectUrl = "/dashboard";
    const roleName = userRole.name.toLowerCase();

    if (roleName === "super_admin") redirectUrl = "/dashboard/super-admin";
    else if (roleName === "hr") redirectUrl = "/dashboard/hr";
    else if (roleName === "store") redirectUrl = "/dashboard/store";
    else if (roleName === "project") redirectUrl = "/dashboard/project";
    else if (roleName === "accounts") redirectUrl = "/dashboard/accounts";
    else if (roleName === "marketing") redirectUrl = "/dashboard/marketing";
    else if (roleName === "design") redirectUrl = "/dashboard/design";

    const response = NextResponse.json(
      { message: "Login successful", redirectUrl },
      { status: 200 }
    );

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, 
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGIN API FATAL ERROR:", error); 
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}