import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Leave from "@/models/Leave";
import PublicHoliday from "@/models/PublicHoliday";
import * as jose from "jose";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    // URL se month aur year nikalenge (e.g., ?month=6&year=2026)
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); 
    const year = searchParams.get("year");

    if (!month || !year) return NextResponse.json({ message: "Month and year required" }, { status: 400 });

    await connectToDatabase();

    // Create regex to match dates like "2026-06-XX"
    const datePattern = new RegExp(`^${year}-${month.padStart(2, '0')}`);

    const attendances = await Attendance.find({ userId, date: { $regex: datePattern } });
    const leaves = await Leave.find({ userId, date: { $regex: datePattern } });
    const holidays = await PublicHoliday.find({ isActive: true, dateString: { $regex: datePattern } });

    return NextResponse.json({ attendances, leaves, holidays });

  } catch (error) {
    console.error("MONTHLY FETCH ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}