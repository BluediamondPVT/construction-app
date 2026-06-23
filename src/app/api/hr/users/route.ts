// src/app/api/hr/users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role"; // Ensure this is imported

export async function GET() {
  try {
    await connectToDatabase();
    
    // Sabhi users ko fetch karo aur role ko populate karne ki koshish karo
    const allUsers = await User.find().populate("role").select("-passwordHash").lean();
    
    // Smart Mapping: Role object hai ya direct string, dono handle karega
    const mappedUsers = allUsers.map((user: any) => {
      let roleName = "Staff"; // Default
      
      if (user.role && user.role.name) {
        roleName = user.role.name; // Agar populate successfully hua
      } else if (typeof user.role === "string") {
        roleName = user.role; // Agar database mein direct string save ho gaya tha
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        isActive: user.isActive
      };
    });

    // Ab "Super_Admin" ko list se hatao
    const employees = mappedUsers.filter((user) => user.role !== "Super_Admin");

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("Users API Error:", error);
    // Error aane par bhi API crash nahi hogi, khali array bhejegi jisse app chalti rahegi
    return NextResponse.json({ employees: [], error: error.message }, { status: 500 }); 
  }
}