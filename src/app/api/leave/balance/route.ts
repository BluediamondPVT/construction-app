// src/app/api/leave/balance/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Leave from "@/models/Leave";
import * as jose from "jose";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // e.g., "2026-07"
    const currentMonth = new Date().toISOString().slice(0, 7);
    const periodMonth = monthParam || currentMonth;

    await connectToDatabase();

    const regexMonth = new RegExp(`^${periodMonth}`);

    const leavesTaken = await Leave.countDocuments({
      userId,
      status: "Approved",
      date: { $regex: regexMonth },
    });

    const pendingLeaves = await Leave.countDocuments({
      userId,
      status: "Pending",
      date: { $regex: regexMonth },
    });

    const monthlyQuota = 1;
    const remainingBalance = Math.max(0, monthlyQuota - leavesTaken);

    return NextResponse.json(
      {
        periodMonth,
        monthlyQuota,
        leavesTaken,
        pendingLeaves,
        remainingBalance,
        isAvailable: remainingBalance > 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET Leave Balance Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
