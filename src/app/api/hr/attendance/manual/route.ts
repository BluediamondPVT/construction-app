import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { userId, date, inTime, outTime, hrNote } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { message: "userId and date are required" },
        { status: 400 }
      );
    }

    let punchInObj = undefined;
    if (inTime) {
      punchInObj = {
        time: new Date(`${date}T${inTime}`),
        location: { latitude: null, longitude: null, address: "Manual HR Entry" },
      };
    }

    let punchOutObj = undefined;
    if (outTime) {
      punchOutObj = {
        time: new Date(`${date}T${outTime}`),
        location: { latitude: null, longitude: null, address: "Manual HR Entry" },
      };
    }

    const existingRecord = await Attendance.findOne({ userId, date });

    if (existingRecord) {
      if (punchInObj) existingRecord.punchIn = punchInObj;
      if (punchOutObj) existingRecord.punchOut = punchOutObj;

      existingRecord.isEditedByHR = true;
      if (hrNote !== undefined) {
        existingRecord.hrNotes = hrNote;
      }
      existingRecord.status = "Present";

      await existingRecord.save();
      return NextResponse.json(
        { message: "Attendance updated successfully", record: existingRecord },
        { status: 200 }
      );
    } else {
      const newRecord = await Attendance.create({
        userId,
        date,
        ...(punchInObj && { punchIn: punchInObj }),
        ...(punchOutObj && { punchOut: punchOutObj }),
        status: "Present",
        isEditedByHR: true,
        hrNotes: hrNote || "",
      });

      return NextResponse.json(
        { message: "Attendance created successfully", record: newRecord },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Manual Attendance API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}