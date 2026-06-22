import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Leave from "@/models/Leave";
import User from "@/models/User";

// GET method ko update karo
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    // Sabhi leaves lao, status ke hisaab se frontend filter kar lega
    const allLeaves = await Leave.find()
      .populate("userId", "name role")
      .sort({ date: -1 }); // Nayi requests upar

    return NextResponse.json({ leaves: allLeaves });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching leaves" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { leaveId, status } = await request.json(); // status = "Approved" | "Rejected"

    if (!leaveId || !status) return NextResponse.json({ message: "Invalid data" }, { status: 400 });

    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      { status },
      { new: true }
    );

    return NextResponse.json({ message: `Leave ${status} successfully` });
  } catch (error) {
    return NextResponse.json({ message: "Error updating leave" }, { status: 500 });
  }
}