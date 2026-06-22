import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Leave from "@/models/Leave";
import * as jose from "jose";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    await connectToDatabase();

    // Aaj ki date nikalo YYYY-MM-DD format mein
    const today = new Date().toLocaleDateString('en-CA'); // e.g., '2026-06-22'

    // Check if on leave today
    const leaveRecord = await Leave.findOne({ userId, date: today });
    if (leaveRecord) {
      return NextResponse.json({ 
        hasPunchedIn: false, 
        hasPunchedOut: false, 
        isOnLeave: true, 
        leaveStatus: leaveRecord.status 
      });
    }

    // Check attendance record
    const attendanceRecord = await Attendance.findOne({ userId, date: today });
    
    if (!attendanceRecord) {
      return NextResponse.json({ hasPunchedIn: false, hasPunchedOut: false, isOnLeave: false });
    }

    return NextResponse.json({
      hasPunchedIn: !!attendanceRecord.punchIn.time,
      hasPunchedOut: !!attendanceRecord.punchOut.time,
      isOnLeave: false,
      record: attendanceRecord
    });

  } catch (error) {
    console.error("TODAY ATTENDANCE ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}