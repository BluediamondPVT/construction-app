import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import User from "@/models/User"; // Populating user data

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const today = new Date().toLocaleDateString('en-CA');
    
    // Aaj ki sabki attendance lao aur User ka naam/role sath attach karo
    const attendances = await Attendance.find({ date: today })
      .populate("userId", "name role email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ attendances });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { recordId, hrNotes, customDate, customTime } = body;

    // customDate aur customTime ko combine karke Date object banate hain
    const combinedDateTime = new Date(`${customDate}T${customTime}`);

    const updatedRecord = await Attendance.findByIdAndUpdate(
      recordId,
      {
        "punchOut.time": combinedDateTime, 
        "punchOut.location.address": "Manually adjusted by HR",
        status: "Present",
        isEditedByHR: true,
        hrNotes: hrNotes || "Fixed via HR Dashboard"
      },
      { new: true }
    );

    return NextResponse.json({ message: "Attendance corrected successfully", record: updatedRecord });
  } catch (error) {
    return NextResponse.json({ message: "Error updating attendance" }, { status: 500 });
  }
}