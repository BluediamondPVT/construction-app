import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Leave from "@/models/Leave";
import PublicHoliday from "@/models/PublicHoliday";
import * as jose from "jose";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    const body = await request.json();
    const { date, type, reason } = body;

    if (!date || !type) {
      return NextResponse.json({ message: "Date and Leave Type are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if date is a declared Public Holiday
    const holiday = await PublicHoliday.findOne({ dateString: date, isActive: true });
    if (holiday) {
      return NextResponse.json(
        { message: `Cannot apply for leave on '${holiday.name}' (${date}) as it is already a declared Paid Holiday.` },
        { status: 400 }
      );
    }

    // Check if leave already requested for this date
    const existingLeave = await Leave.findOne({ userId, date });

    if (existingLeave) {
      return NextResponse.json({ message: "Leave already requested for this date" }, { status: 400 });
    }

    const newLeave = await Leave.create({
      userId,
      date,
      type,
      reason: reason || "",
      status: "Pending" 
    });

    return NextResponse.json({ message: "Leave requested successfully", leave: newLeave });
  } catch (error) {
    console.error("LEAVE REQUEST ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}