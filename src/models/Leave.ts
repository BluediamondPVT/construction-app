// src/models/Leave.ts
import mongoose, { Schema, Document } from "mongoose";

export type OfficialLeaveType =
  | "CL"          // Casual Leave (7 days/yr)
  | "SL"          // Sick Leave (8 days/yr)
  | "EL"          // Earned / Privilege Leave (15 days/yr, 1.5/mo)
  | "MATERNITY"   // Maternity Leave (Up to 26 weeks)
  | "PATERNITY"   // Paternity Leave (Up to 5 days)
  | "COMP_OFF"    // Compensatory Off (Within 90 days)
  | "BEREAVEMENT" // Bereavement Leave (Up to 3 days)
  | "MARRIAGE"    // Marriage Leave (Up to 3 days)
  | "LWP"         // Leave Without Pay (Unpaid)
  | "TL"          // Travel / Duty Leave (Legacy / Official Duty)
  | "OTHER";

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  type: OfficialLeaveType;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

export const OFFICIAL_LEAVE_POLICY = {
  CL: {
    name: "Casual Leave",
    code: "CL",
    annualQuota: 7,
    isPaid: true,
    description: "7 days/yr • Max 3 consecutive days • Non-encashable",
  },
  SL: {
    name: "Sick Leave",
    code: "SL",
    annualQuota: 8,
    isPaid: true,
    description: "8 days/yr • Medical cert required if > 2 consecutive days",
  },
  EL: {
    name: "Earned / Privilege Leave",
    code: "EL",
    annualQuota: 15,
    isPaid: true,
    description: "15 days/yr (1.5 days/month accrual) • Encashable • Carry forward up to 45 days",
  },
  MATERNITY: {
    name: "Maternity Leave",
    code: "MATERNITY",
    annualQuota: 182,
    isPaid: true,
    description: "Up to 26 weeks paid leave as per Maternity Benefit Act, 1961",
  },
  PATERNITY: {
    name: "Paternity Leave",
    code: "PATERNITY",
    annualQuota: 5,
    isPaid: true,
    description: "Up to 5 days following childbirth",
  },
  COMP_OFF: {
    name: "Compensatory Off",
    code: "COMP_OFF",
    annualQuota: 30,
    isPaid: true,
    description: "Earned on approved weekly offs/holidays • Valid for 90 days",
  },
  BEREAVEMENT: {
    name: "Bereavement Leave",
    code: "BEREAVEMENT",
    annualQuota: 3,
    isPaid: true,
    description: "Up to 3 days for immediate family member bereavement",
  },
  MARRIAGE: {
    name: "Marriage Leave",
    code: "MARRIAGE",
    annualQuota: 3,
    isPaid: true,
    description: "Up to 3 days for employee's own marriage",
  },
  LWP: {
    name: "Leave Without Pay",
    code: "LWP",
    annualQuota: 365,
    isPaid: false,
    description: "Unpaid absence • Salary deduction applies",
  },
  TL: {
    name: "Travel / Duty Leave",
    code: "TL",
    annualQuota: 30,
    isPaid: true,
    description: "Official travel or on-duty assignment",
  },
  OTHER: {
    name: "Other Approved Leave",
    code: "OTHER",
    annualQuota: 10,
    isPaid: true,
    description: "Other special authorized leave",
  },
};

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "CL",
        "SL",
        "EL",
        "MATERNITY",
        "PATERNITY",
        "COMP_OFF",
        "BEREAVEMENT",
        "MARRIAGE",
        "LWP",
        "TL",
        "OTHER",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicate leave requests for the same day
LeaveSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Leave || mongoose.model<ILeave>("Leave", LeaveSchema);