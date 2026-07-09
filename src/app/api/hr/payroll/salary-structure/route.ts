// src/app/api/hr/payroll/salary-structure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SalaryStructure from "@/models/SalaryStructure";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      const struct = await SalaryStructure.findOne({ userId, isActive: true });
      return NextResponse.json({ structure: struct || null }, { status: 200 });
    }

    // Fetch all active users and merge with existing salary structures
    const allUsers = await User.find({ isActive: true })
      .populate("role", "name")
      .select("name email role")
      .lean();

    const allStructures = await SalaryStructure.find({ isActive: true }).lean();
    const structureMap = new Map(
      allStructures.map((s: any) => [s.userId.toString(), s])
    );

    const setupList = allUsers.map((user: any) => {
      const roleName =
        user.role && typeof user.role === "object" && user.role.name
          ? user.role.name
          : typeof user.role === "string"
          ? user.role
          : "Staff";

      const existingStruct = structureMap.get(user._id.toString());

      return {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: roleName,
        },
        structure: existingStruct
          ? {
              _id: existingStruct._id,
              dailyRate: existingStruct.dailyRate ?? 0,
              overtimeRate: existingStruct.overtimeRate ?? 0,
              monthlyFixedSalary: existingStruct.monthlyFixedSalary ?? 0,
              standardShiftHours: existingStruct.standardShiftHours ?? 9,
            }
          : {
              dailyRate: 800,
              overtimeRate: 120,
              monthlyFixedSalary: 0,
              standardShiftHours: 9,
            },
      };
    });

    return NextResponse.json({ employees: setupList }, { status: 200 });
  } catch (error: any) {
    console.error("GET SalaryStructure Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, dailyRate, overtimeRate, monthlyFixedSalary, standardShiftHours } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updated = await SalaryStructure.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          dailyRate: Number(dailyRate ?? 0),
          overtimeRate: Number(overtimeRate ?? 0),
          monthlyFixedSalary: Number(monthlyFixedSalary ?? 0),
          standardShiftHours: Number(standardShiftHours ?? 9),
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        message: "Salary structure saved successfully",
        structure: updated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST SalaryStructure Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
