import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import User from "@/models/User"; // Populating user data

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const queryDate = dateParam || new Date().toISOString().split("T")[0];
    
    // Aaj ki sabki attendance lao aur User ka naam/role sath attach karo
    const attendances = await Attendance.find({ date: queryDate })
      .populate({
        path: "userId",
        select: "name role",
        populate: { path: "role", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const formattedAttendances = attendances.map((att: any) => {
      if (att.userId) {
        let roleName = "Staff";
        if (att.userId.role && typeof att.userId.role === "object" && att.userId.role.name) {
          roleName = att.userId.role.name;
        } else if (typeof att.userId.role === "string") {
          roleName = att.userId.role;
        }
        return {
          ...att,
          userId: {
            ...att.userId,
            role: roleName,
          },
        };
      }
      return att;
    });

    return NextResponse.json({ attendances: formattedAttendances });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { recordId, id, _id, date, punchInTime, punchOutTime, status, hrNotes } = body;
    const targetId = recordId || id || _id;

    if (!targetId) {
      return NextResponse.json({ message: "Record ID is required" }, { status: 400 });
    }

    const existingRecord = await Attendance.findById(targetId);
    if (!existingRecord) {
      return NextResponse.json({ message: "Attendance record not found" }, { status: 404 });
    }

    const recordDate = date || existingRecord.date;
    const updateData: any = {};

    if (date) updateData.date = date;

    // Update the status field to whatever is passed in the request body
    if (status !== undefined) {
      updateData.status = status;
    }

    // When HR updates a record's in/out time, strictly set isEditedByHR: true
    let isTimeUpdated = false;

    if (punchInTime !== undefined) {
      isTimeUpdated = true;
      if (punchInTime !== "") {
        updateData["punchIn.time"] = new Date(`${recordDate}T${punchInTime}`);
        updateData["punchIn.location.address"] = "Manually adjusted by HR";
      } else {
        updateData["punchIn.time"] = null;
      }
    }

    if (punchOutTime !== undefined) {
      isTimeUpdated = true;
      if (punchOutTime !== "") {
        updateData["punchOut.time"] = new Date(`${recordDate}T${punchOutTime}`);
        updateData["punchOut.location.address"] = "Manually adjusted by HR";
      } else {
        updateData["punchOut.time"] = null;
      }
    }

    if (isTimeUpdated || hrNotes !== undefined || status !== undefined || date !== undefined) {
      updateData.isEditedByHR = true;
    }

    if (hrNotes !== undefined) {
      updateData.hrNotes = hrNotes;
    } else if (!existingRecord.hrNotes && updateData.isEditedByHR) {
      updateData.hrNotes = "Fixed via HR Dashboard";
    }

    const updatedRecord = await Attendance.findByIdAndUpdate(
      targetId,
      { $set: updateData },
      { new: true }
    ).populate({
      path: "userId",
      select: "name role",
      populate: { path: "role", select: "name" },
    });

    return NextResponse.json({ message: "Attendance corrected successfully", record: updatedRecord });
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating attendance", error: error.message }, { status: 500 });
  }
}