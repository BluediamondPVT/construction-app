// src/models/PayrollRecord.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface IPayrollAdjustment {
  type: "BONUS" | "PENALTY" | "ALLOWANCE" | "OTHER";
  amount: number;
  reason: string;
  addedBy: string;
  createdAt: Date;
}

export interface IPayrollRecord extends Document {
  userId: mongoose.Types.ObjectId;
  periodMonth: string; // Format: "YYYY-MM" (e.g., "2026-07")
  siteId?: mongoose.Types.ObjectId;

  // Attendance Summary
  totalPresentDays: number;
  totalAbsentDays: number;
  totalWorkingHours: number;
  averageWorkingDays: number;
  overtimeHours: number;

  // Leave Quota & LWP Tracking
  approvedLeavesCount?: number;
  paidLeaveDays?: number;
  lwpDays?: number;
  publicHolidayDays?: number;


  // Financial Breakdowns
  dailyRate: number;
  overtimeRate: number;
  baseCalculatedEarnings: number;
  overtimeEarnings: number;
  absentPenaltyDeductions: number;

  // HR Manual Adjustments
  adjustments: IPayrollAdjustment[];

  // Final Payout
  netPayableAmount: number;

  // Workflow Status
  status: "DRAFT" | "APPROVED_LOCKED";
  approvedBy?: string;
  approvedAt?: Date;
}

const PayrollRecordSchema = new Schema<IPayrollRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    periodMonth: { type: String, required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: "Site" },

    totalPresentDays: { type: Number, default: 0 },
    totalAbsentDays: { type: Number, default: 0 },
    totalWorkingHours: { type: Number, default: 0 },
    averageWorkingDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },

    approvedLeavesCount: { type: Number, default: 0 },
    paidLeaveDays: { type: Number, default: 0 },
    lwpDays: { type: Number, default: 0 },
    publicHolidayDays: { type: Number, default: 0 },


    dailyRate: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0 },
    baseCalculatedEarnings: { type: Number, default: 0 },
    overtimeEarnings: { type: Number, default: 0 },
    absentPenaltyDeductions: { type: Number, default: 0 },

    adjustments: [
      {
        type: { type: String, enum: ["BONUS", "PENALTY", "ALLOWANCE", "OTHER"], required: true },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        addedBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    netPayableAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED_LOCKED"],
      default: "DRAFT",
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

PayrollRecordSchema.index({ userId: 1, periodMonth: 1 }, { unique: true });

const PayrollRecord = models.PayrollRecord || mongoose.model<IPayrollRecord>("PayrollRecord", PayrollRecordSchema);
export default PayrollRecord;
