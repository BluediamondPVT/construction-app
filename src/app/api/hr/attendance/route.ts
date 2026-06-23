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
    const { recordId, date, punchInTime, punchOutTime, status, hrNotes } = body;

    const updateData: any = {
      isEditedByHR: true,
      hrNotes: hrNotes || "Fixed via HR Dashboard"
    };

    if (date) updateData.date = date;
    if (status) updateData.status = status;

    if (punchInTime && date) {
      updateData["punchIn.time"] = new Date(`${date}T${punchInTime}`);
      updateData["punchIn.location.address"] = "Manually adjusted by HR";
    }

    if (punchOutTime && date) {
      updateData["punchOut.time"] = new Date(`${date}T${punchOutTime}`);
      updateData["punchOut.location.address"] = "Manually adjusted by HR";
    }

    const updatedRecord = await Attendance.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true }
    );

    return NextResponse.json({ message: "Attendance corrected successfully", record: updatedRecord });
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating attendance", error: error.message }, { status: 500 });
  }
}