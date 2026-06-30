// src/app/api/setup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import Role from "@/models/Role";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();

    // Step 1: Create the God Mode role if it does not exist
    let superAdminRole = await Role.findOne({ name: "Super_Admin" });

    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: "Super_Admin",
        permissions: ["all_access"], 
      }); 
      console.log("Super_Admin role created successfully");
    }

    // Step 2: Create the default Super Admin user if it does not exist
    const adminEmail = "admin@company.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Hashing the default password "Admin@123"
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin@123", salt);

      await User.create({
        name: "System God",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: superAdminRole._id,
        isActive: true,
      });

      return NextResponse.json(
        { 
          message: "Setup complete. Super Admin created.",
          credentials: {
            email: "admin@company.com",
            password: "Admin@123"
          }
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Setup already executed. Super Admin exists in the database." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Setup Script Error:", error);
    return NextResponse.json(
      { message: "Internal server error during setup execution" },
      { status: 500 }
    );
  }
}