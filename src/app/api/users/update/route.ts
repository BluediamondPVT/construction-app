// src/app/api/users/update/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email, isActive, newPassword, permissions } = body;

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 1. Update Basic Info
    if (name) user.name = name;
    if (email) user.email = email;
    if (isActive !== undefined) user.isActive = isActive;

    // 2. Update Permissions in the Role document
    const role = await Role.findById(user.role);
    if (role && permissions) {
      role.permissions = permissions;
      await role.save();
    }

    // 3. Update password if Admin entered a new one
    if (newPassword && newPassword.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    // Save final user document
    await user.save();

    return NextResponse.json({ message: "User completely updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("UPDATE USER API ERROR:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}