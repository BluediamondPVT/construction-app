import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PublicHoliday from "@/models/PublicHoliday";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const query: any = {};
    if (year) {
      query.dateString = { $regex: `^${year}-` };
    }

    const holidays = await PublicHoliday.find(query).sort({ dateString: 1 });
    return NextResponse.json({ holidays }, { status: 200 });
  } catch (error) {
    console.error("GET /api/hr/holidays error:", error);
    return NextResponse.json({ message: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, dateString, type, isActive = true, description = "" } = await request.json();

    if (!name || !dateString || !type) {
      return NextResponse.json(
        { message: "Name, dateString (YYYY-MM-DD), and type are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if holiday with same date and name already exists
    const existing = await PublicHoliday.findOne({ dateString, name });
    if (existing) {
      return NextResponse.json(
        { message: `Holiday '${name}' on ${dateString} already exists.` },
        { status: 409 }
      );
    }

    const newHoliday = await PublicHoliday.create({
      name,
      date: new Date(dateString),
      dateString,
      type,
      isActive,
      description,
    });

    return NextResponse.json({ holiday: newHoliday }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/hr/holidays error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create holiday" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, dateString, type, isActive, description } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "Holiday ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (dateString !== undefined) {
      updateFields.dateString = dateString;
      updateFields.date = new Date(dateString);
    }
    if (type !== undefined) updateFields.type = type;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (description !== undefined) updateFields.description = description;

    const updatedHoliday = await PublicHoliday.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedHoliday) {
      return NextResponse.json({ message: "Holiday not found." }, { status: 404 });
    }

    return NextResponse.json({ holiday: updatedHoliday }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/hr/holidays error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update holiday" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Holiday ID required" }, { status: 400 });
    }

    await connectToDatabase();
    await PublicHoliday.findByIdAndDelete(id);

    return NextResponse.json({ message: "Holiday deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/hr/holidays error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
