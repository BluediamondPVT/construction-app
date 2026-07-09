// src/app/api/hr/payroll/adjust/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PayrollRecord from "@/models/PayrollRecord";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, periodMonth, type, amount, reason, addedBy } = body;

    if (!userId || !periodMonth || !type || amount === undefined || !reason) {
      return NextResponse.json(
        { error: "Missing required fields (userId, periodMonth, type, amount, reason)" },
        { status: 400 }
      );
    }

    const record = await PayrollRecord.findOne({ userId, periodMonth });
    if (!record) {
      return NextResponse.json(
        { error: "Payroll record not found. Please refresh calculations first." },
        { status: 404 }
      );
    }

    if (record.status === "APPROVED_LOCKED") {
      return NextResponse.json(
        { error: "Forbidden: Cannot modify an approved and locked salary period." },
        { status: 403 }
      );
    }

    const adjustment = {
      type,
      amount: Number(amount),
      reason,
      addedBy: addedBy || "HR Admin",
      createdAt: new Date(),
    };

    record.adjustments.push(adjustment);

    // Recalculate net payable amount
    const totalAdjustments = record.adjustments.reduce(
      (acc: number, item: any) => acc + (item.amount || 0),
      0
    );

    const newNetPayable = Math.max(
      0,
      Number(
        (
          record.baseCalculatedEarnings +
          record.overtimeEarnings -
          record.absentPenaltyDeductions +
          totalAdjustments
        ).toFixed(2)
      )
    );

    record.netPayableAmount = newNetPayable;
    await record.save();

    return NextResponse.json(
      { message: "Adjustment applied successfully", record },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST Payroll Adjust Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
