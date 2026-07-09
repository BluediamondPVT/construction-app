// src/app/api/hr/payroll/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateAllEmployeesPayrollForMonth } from "@/lib/payrollEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const periodMonthParam = searchParams.get("month");

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-07"
    const periodMonth = periodMonthParam || currentMonth;

    const records = await calculateAllEmployeesPayrollForMonth(periodMonth);

    let totalPayrollCost = 0;
    let totalHoursWorked = 0;
    let lockedRecordsCount = 0;
    let draftRecordsCount = 0;
    let totalWorkingDays = 0;

    for (const rec of records) {
      totalPayrollCost += rec.netPayableAmount || 0;
      totalHoursWorked += rec.totalWorkingHours || 0;
      totalWorkingDays += rec.averageWorkingDays || 0;
      if (rec.status === "APPROVED_LOCKED") {
        lockedRecordsCount += 1;
      } else {
        draftRecordsCount += 1;
      }
    }

    const avgEnterpriseWorkingDays = records.length
      ? Number((totalWorkingDays / records.length).toFixed(2))
      : 0;

    return NextResponse.json(
      {
        periodMonth,
        summary: {
          totalEmployees: records.length,
          totalPayrollCost: Number(totalPayrollCost.toFixed(2)),
          totalHoursWorked: Number(totalHoursWorked.toFixed(2)),
          lockedRecordsCount,
          draftRecordsCount,
          avgEnterpriseWorkingDays,
        },
        records,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET Payroll Summary Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
