// src/app/api/users/create/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, role, permissions } = body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check if the user already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "A user with this email already exists" },
                { status: 409 }
            );
        }

        // Create a unique role name for this specific user to allow granular permissions
        // Example: Store_amit@company.com
        const uniqueRoleName = `${role}_${email}`;

        // Create the custom Role document in the database
        const newRole = await Role.create({
            name: uniqueRoleName,
            permissions: permissions,
        });

        // Hash the temporary password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new User document and link the Role _id
        const newUser = await User.create({
            name,
            email,
            passwordHash: hashedPassword,
            role: newRole._id,
            isActive: true,
        });

        return NextResponse.json(
            {
                message: "Staff member created successfully",
                user: { name: newUser.name, email: newUser.email }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("USER CREATION API ERROR:", error);
        return NextResponse.json(
            { message: "Internal server error while creating user" },
            { status: 500 }
        );
    }
}

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all users from the database
    const users = await User.find({}).sort({ createdAt: -1 });

    // Fetch all roles to map them manually (Bulletproof against Next.js tree-shaking bugs)
    const roles = await Role.find({});
    const roleMap = new Map(roles.map((r) => [r._id.toString(), r]));

    // Format data cleanly for the frontend table
    const formattedUsers = users.map((user) => {
      const userRole = roleMap.get(user.role.toString());
      
      // Clean the unique role name for display (e.g., "Store_abc@gmail.com" -> "Store")
      const displayRole = userRole ? userRole.name.split("_")[0] : "Unknown";

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: displayRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("FETCH USERS API ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching users" },
      { status: 500 }
    );
  }
}