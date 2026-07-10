// src/lib/payrollEngine.ts
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Leave from "@/models/Leave";
import SalaryStructure from "@/models/SalaryStructure";
import PayrollRecord, { IPayrollRecord } from "@/models/PayrollRecord";
import User from "@/models/User";
import PublicHoliday from "@/models/PublicHoliday";


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
  approvedLeavesCount?: number;
  paidLeaveDays?: number;
  lwpDays?: number;
  publicHolidayDays?: number;
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
      approvedLeavesCount: existingRecord.approvedLeavesCount || 0,
      paidLeaveDays: existingRecord.paidLeaveDays || 0,
      lwpDays: existingRecord.lwpDays || 0,
      publicHolidayDays: existingRecord.publicHolidayDays || 0,
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

  // 3b. Query Leave model for 'Approved' leaves in this periodMonth ("YYYY-MM")
  const approvedLeaves = await Leave.find({
    userId,
    status: "Approved",
    date: { $regex: regexMonth },
  });

  // 3c. Query active PublicHoliday records for this periodMonth ("YYYY-MM")
  const activeHolidays = await PublicHoliday.find({
    isActive: true,
    dateString: { $regex: regexMonth },
  });

  const approvedLeavesCount = approvedLeaves.length;


  // Official Leave Policy:
  // Approved Paid Leaves (CL, SL, EL, Maternity, Paternity, Comp-Off, Bereavement, Marriage, TL) credit standard shift hours.
  // Approved LWP (Leave Without Pay) days do NOT add working hours (salary deduction applies).
  const paidLeaveRecords = approvedLeaves.filter((l: any) => l.type !== "LWP");
  const lwpRecords = approvedLeaves.filter((l: any) => l.type === "LWP");

  const paidLeaveDays = paidLeaveRecords.length;
  const lwpDays = lwpRecords.length;

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
      // If the absent mark falls on a declared Public Holiday, do NOT count it as a penalized absent day
      const isHoliday = activeHolidays.some((h: any) => h.dateString === record.date);
      if (!isHoliday) {
        totalAbsentDays += 1;
      }
    }
  }

  // Calculate Public Holiday credit: Any active holiday where employee did not work is treated as a Paid Holiday
  let publicHolidayDays = 0;
  for (const holiday of activeHolidays) {
    const workedOnHoliday = attendanceRecords.some(
      (r: any) => r.date === holiday.dateString && (r.status === "Present" || r.status === "In Progress")
    );
    if (!workedOnHoliday) {
      publicHolidayDays += 1;
    }
  }

  // Add up to 1 day's worth of hours for the allowed Paid Leave
  if (paidLeaveDays > 0) {
    totalWorkingHours += paidLeaveDays * standardShiftHours;
  }

  // Add standard shift hours for each Public Holiday where employee did not work
  if (publicHolidayDays > 0) {
    totalWorkingHours += publicHolidayDays * standardShiftHours;
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
  // Ensure we don't deduct for the 1 allowed Paid Leave
  let absentPenaltyDeductions = 0;
  const effectiveAbsentDays = Math.max(0, totalAbsentDays - paidLeaveDays);
  if (monthlyFixedSalary > 0 && effectiveAbsentDays > 0) {
    const dailyEquivalent = monthlyFixedSalary / 30;
    absentPenaltyDeductions = Number((effectiveAbsentDays * dailyEquivalent).toFixed(2));
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
        approvedLeavesCount,
        paidLeaveDays,
        lwpDays,
        publicHolidayDays,
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
    approvedLeavesCount,
    paidLeaveDays,
    lwpDays,
    publicHolidayDays,
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
