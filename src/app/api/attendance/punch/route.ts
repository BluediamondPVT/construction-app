import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import * as jose from "jose";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    const body = await request.json();
    const { action, location } = body; // action: "IN" | "OUT"

    if (!location || !location.latitude || !location.longitude) {
      return NextResponse.json({ message: "Location coordinates are required!" }, { status: 400 });
    }

    await connectToDatabase();
    const today = new Date().toLocaleDateString('en-CA');
    const currentTime = new Date();

    if (action === "IN") {
      // Create new record for today
      const newRecord = await Attendance.findOneAndUpdate(
        { userId, date: today },
        {
          punchIn: { time: currentTime, location },
          status: "In Progress" // Initial status, will become Missed Out if not punched out
        },
        { new: true, upsert: true }
      );
      return NextResponse.json({ message: "Punched IN successfully", record: newRecord });
    } 
    else if (action === "OUT") {
      // Update existing record
      const updatedRecord = await Attendance.findOneAndUpdate(
        { userId, date: today },
        {
          punchOut: { time: currentTime, location },
          status: "Present" // Din successfully khatam!
        },
        { new: true }
      );
      return NextResponse.json({ message: "Punched OUT successfully", record: updatedRecord });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("PUNCH API ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}