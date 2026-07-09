// src/lib/payrollEngine.ts
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import SalaryStructure from "@/models/SalaryStructure";
import PayrollRecord, { IPayrollRecord } from "@/models/PayrollRecord";
import User from "@/models/User";

export interface PayrollCalculationResult {
  userId: string;
  periodMonth: string;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalWorkingHours: number;
  averageWorkingDays: number;
  overtimeHours: number;
  dailyRate: number;
  overtimeRate: number;
  baseCalculatedEarnings: number;
  overtimeEarnings: number;
  absentPenaltyDeductions: number;
  adjustments: any[];
  netPayableAmount: number;
  status: "DRAFT" | "APPROVED_LOCKED";
  isLocked: boolean;
}

/**
 * Calculates and updates monthly payroll for a specific employee.
 * Handles cross-day shifts past midnight via UTC timestamps and enforces period locks.
 */
export async function calculateEmployeePayrollForMonth(
  userId: string,
  periodMonth: string
): Promise<PayrollCalculationResult> {
  await connectToDatabase();

  // 1. Check existing record - if APPROVED_LOCKED, do not recalculate
  const existingRecord = await PayrollRecord.findOne({ userId, periodMonth });
  if (existingRecord && existingRecord.status === "APPROVED_LOCKED") {
    return {
      userId: existingRecord.userId.toString(),
      periodMonth: existingRecord.periodMonth,
      totalPresentDays: existingRecord.totalPresentDays,
      totalAbsentDays: existingRecord.totalAbsentDays,
      totalWorkingHours: existingRecord.totalWorkingHours,
      averageWorkingDays: existingRecord.averageWorkingDays,
      overtimeHours: existingRecord.overtimeHours,
      dailyRate: existingRecord.dailyRate,
      overtimeRate: existingRecord.overtimeRate,
      baseCalculatedEarnings: existingRecord.baseCalculatedEarnings,
      overtimeEarnings: existingRecord.overtimeEarnings,
      absentPenaltyDeductions: existingRecord.absentPenaltyDeductions,
      adjustments: existingRecord.adjustments || [],
      netPayableAmount: existingRecord.netPayableAmount,
      status: "APPROVED_LOCKED",
      isLocked: true,
    };
  }

  // 2. Fetch employee's SalaryStructure (or fallback to standard default rates)
  const salaryStruct = await SalaryStructure.findOne({ userId, isActive: true });
  const dailyRate = salaryStruct?.dailyRate ?? 800;
  const overtimeRate = salaryStruct?.overtimeRate ?? 120;
  const monthlyFixedSalary = salaryStruct?.monthlyFixedSalary ?? 0;
  const standardShiftHours = salaryStruct?.standardShiftHours ?? 9;

  // 3. Fetch all attendance records for this user in the given periodMonth ("YYYY-MM")
  const regexMonth = new RegExp(`^${periodMonth}`);
  const attendanceRecords = await Attendance.find({
    userId,
    date: { $regex: regexMonth },
  });

  let totalPresentDays = 0;
  let totalAbsentDays = 0;
  let totalWorkingHours = 0;
  let totalOvertimeHours = 0;

  for (const record of attendanceRecords) {
    if (record.status === "Present" || record.status === "In Progress") {
      if (record.status === "Present") {
        totalPresentDays += 1;
      }

      if (record.punchIn?.time && record.punchOut?.time) {
        const pin = new Date(record.punchIn.time).getTime();
        const pout = new Date(record.punchOut.time).getTime();

        if (pout > pin) {
          // Duration in hours (automatically handles cross-day night shifts extending past midnight)
          let dailyHours = (pout - pin) / (1000 * 60 * 60);

          // Safety bounds clamping against accidental double punches or sensor anomalies
          dailyHours = Math.max(0, Math.min(dailyHours, 24));
          totalWorkingHours += dailyHours;

          // Overtime calculation above standard shift duration (e.g. 9 hours)
          if (dailyHours > standardShiftHours) {
            totalOvertimeHours += dailyHours - standardShiftHours;
          }
        }
      }
    } else if (record.status === "Absent") {
      totalAbsentDays += 1;
    }
  }

  // Round metrics cleanly
  totalWorkingHours = Number(totalWorkingHours.toFixed(2));
  totalOvertimeHours = Number(totalOvertimeHours.toFixed(2));

  // Average Working Days formula: Total Working Hours / 9 (standard shift)
  const averageWorkingDays = Number((totalWorkingHours / standardShiftHours).toFixed(2));

  // Financial Breakdown formulas
  const baseCalculatedEarnings = Number((averageWorkingDays * dailyRate).toFixed(2));
  const overtimeEarnings = Number((totalOvertimeHours * overtimeRate).toFixed(2));

  // Absent penalty deductions (if salaried employee pro-rata deduction applies)
  let absentPenaltyDeductions = 0;
  if (monthlyFixedSalary > 0 && totalAbsentDays > 0) {
    const dailyEquivalent = monthlyFixedSalary / 30;
    absentPenaltyDeductions = Number((totalAbsentDays * dailyEquivalent).toFixed(2));
  }

  // Keep existing HR adjustments if draft existed
  const adjustments = existingRecord?.adjustments || [];
  const totalAdjustments = adjustments.reduce((acc: number, adj: any) => acc + (adj.amount || 0), 0);

  // Final Payout Formula
  const rawNetPayable =
    baseCalculatedEarnings + overtimeEarnings - absentPenaltyDeductions + totalAdjustments;
  const netPayableAmount = Math.max(0, Number(rawNetPayable.toFixed(2)));

  // 4. Upsert PayrollRecord as DRAFT
  const updatedRecord = await PayrollRecord.findOneAndUpdate(
    { userId, periodMonth },
    {
      $set: {
        totalPresentDays,
        totalAbsentDays,
        totalWorkingHours,
        averageWorkingDays,
        overtimeHours: totalOvertimeHours,
        dailyRate,
        overtimeRate,
        baseCalculatedEarnings,
        overtimeEarnings,
        absentPenaltyDeductions,
        adjustments,
        netPayableAmount,
        status: "DRAFT",
      },
    },
    { upsert: true, new: true }
  );

  return {
    userId,
    periodMonth,
    totalPresentDays,
    totalAbsentDays,
    totalWorkingHours,
    averageWorkingDays,
    overtimeHours: totalOvertimeHours,
    dailyRate,
    overtimeRate,
    baseCalculatedEarnings,
    overtimeEarnings,
    absentPenaltyDeductions,
    adjustments,
    netPayableAmount,
    status: "DRAFT",
    isLocked: false,
  };
}

/**
 * Runs calculation engine for all active employees for a given month.
 */
export async function calculateAllEmployeesPayrollForMonth(periodMonth: string) {
  await connectToDatabase();
  const allUsers = await User.find({ isActive: true }).select("_id name email role").lean();
  
  const results = [];
  for (const user of allUsers) {
    // Avoid calculating for Super_Admin if appropriate
    try {
      const calcResult = await calculateEmployeePayrollForMonth(user._id.toString(), periodMonth);
      results.push({
        ...calcResult,
        user,
      });
    } catch (err) {
      console.error(`Error calculating payroll for user ${user._id}:`, err);
    }
  }

  return results;
}
