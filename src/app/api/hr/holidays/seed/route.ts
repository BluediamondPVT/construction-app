import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PublicHoliday, { HolidayType } from "@/models/PublicHoliday";

interface StandardHolidayTemplate {
  name: string;
  monthDay: string; // MM-DD
  type: HolidayType;
  description: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const currentYear = new Date().getFullYear();
    const targetYear = body.year ? Number(body.year) : currentYear;

    await connectToDatabase();

    // Standard Holidays (Fixed and Estimated Lunar for the target year)
    // HR can easily edit lunar dates in the UI if moon sighting shifts them by a day
    const standardHolidays: StandardHolidayTemplate[] = [
      {
        name: "Republic Day",
        monthDay: "01-26",
        type: "National",
        description: "National Holiday celebrating the Constitution of India",
      },
      {
        name: "Idul Fitr (Day 1)",
        monthDay: "03-20",
        type: "Religious",
        description: "Islamic lunar calendar holiday (Subject to moon sighting)",
      },
      {
        name: "Idul Fitr (Day 2)",
        monthDay: "03-21",
        type: "Religious",
        description: "Islamic lunar calendar holiday (Subject to moon sighting)",
      },
      {
        name: "Maharashtra Day",
        monthDay: "05-01",
        type: "Regional",
        description: "Regional Holiday celebrating the formation of Maharashtra state",
      },
      {
        name: "Eid ul Azha (Day 1)",
        monthDay: "05-27",
        type: "Religious",
        description: "Islamic lunar calendar holiday (Subject to moon sighting)",
      },
      {
        name: "Eid ul Azha (Day 2)",
        monthDay: "05-28",
        type: "Religious",
        description: "Islamic lunar calendar holiday (Subject to moon sighting)",
      },
      {
        name: "Muharram",
        monthDay: "06-26",
        type: "Religious",
        description: "Islamic lunar calendar holiday (Subject to moon sighting)",
      },
      {
        name: "Independence Day",
        monthDay: "08-15",
        type: "National",
        description: "National Holiday celebrating Indian Independence",
      },
    ];

    let seededCount = 0;

    for (const h of standardHolidays) {
      const dateString = `${targetYear}-${h.monthDay}`;
      const existing = await PublicHoliday.findOne({ dateString, name: h.name });
      if (!existing) {
        await PublicHoliday.create({
          name: h.name,
          date: new Date(dateString),
          dateString,
          type: h.type,
          isActive: true,
          description: h.description,
        });
        seededCount++;
      }
    }

    const allHolidays = await PublicHoliday.find({
      dateString: { $regex: `^${targetYear}-` },
    }).sort({ dateString: 1 });

    return NextResponse.json(
      {
        message: `Successfully seeded ${seededCount} holidays for ${targetYear}`,
        holidays: allHolidays,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/hr/holidays/seed error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to seed holidays" },
      { status: 500 }
    );
  }
}
