// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

// NEXT.JS CACHE KILLER: Yeh line Next.js ko force karti hai ki hamesha fresh data laaye
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all users from the database
    const users = await User.find({}).sort({ createdAt: -1 });

    // Fetch all roles to map them manually
    const roles = await Role.find({});
    const roleMap = new Map(roles.map((r) => [r._id.toString(), r]));

   // src/app/api/users/route.ts ke andar format block ko aise update karo:
    const formattedUsers = users.map((user) => {
      const userRole = user.role ? roleMap.get(user.role.toString()) : null;
      const displayRole = userRole ? userRole.name.split("_")[0] : "Super Admin";

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: displayRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        permissions: userRole ? userRole.permissions : [], // YE NAYI LINE ADD KI HAI
      };
    });

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error) {
    console.error("FETCH USERS API FATAL ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching users" },
      { status: 500 }
    );
  }
}