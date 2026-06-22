import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Leave from "@/models/Leave";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ message: "User ID required" }, { status: 400 });

    await connectToDatabase();
    
    // Fetch last 3 months data automatically for profile insights
    const attendances = await Attendance.find({ userId });
    const leaves = await Leave.find({ userId });

    return NextResponse.json({ attendances, leaves });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}