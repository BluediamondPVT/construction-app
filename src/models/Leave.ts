import mongoose, { Schema, Document } from "mongoose";

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  type: "CL" | "SL" | "TL";
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ["CL", "SL", "TL"], required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Prevent duplicate leave requests for the same day
LeaveSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Leave || mongoose.model<ILeave>("Leave", LeaveSchema);