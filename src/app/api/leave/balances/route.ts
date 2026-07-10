import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Leave, { OFFICIAL_LEAVE_POLICY } from "@/models/Leave";
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
    const yearParam = searchParams.get("year");
    const currentYear = new Date().getFullYear().toString();
    const targetYear = yearParam || currentYear;

    await connectToDatabase();

    // Query all leaves for this user in the specified calendar year
    const regexYear = new RegExp(`^${targetYear}`);
    const userLeaves = await Leave.find({
      userId,
      date: { $regex: regexYear },
    }).lean();

    const balances: Record<string, any> = {};
    const summaryList: any[] = [];

    for (const [code, policy] of Object.entries(OFFICIAL_LEAVE_POLICY)) {
      const approvedLeaves = userLeaves.filter(
        (l: any) => l.type === code && l.status === "Approved"
      );
      const pendingLeaves = userLeaves.filter(
        (l: any) => l.type === code && l.status === "Pending"
      );

      const used = approvedLeaves.length;
      const pending = pendingLeaves.length;
      const quota = policy.annualQuota;
      const remaining = code === "LWP" ? 365 : Math.max(0, quota - used);
      const isLowBalance = code !== "LWP" && remaining <= 1;
      const percentageUsed = Math.min(100, Math.round((used / quota) * 100));

      const balanceData = {
        code,
        name: policy.name,
        quota,
        used,
        pending,
        remaining,
        isPaid: policy.isPaid,
        description: policy.description,
        isLowBalance,
        percentageUsed,
      };

      balances[code] = balanceData;
      summaryList.push(balanceData);
    }

    return NextResponse.json(
      {
        year: targetYear,
        balances,
        summaryList,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET Leave Balances Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
