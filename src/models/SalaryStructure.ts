// src/models/SalaryStructure.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface ISalaryStructure extends Document {
  userId: mongoose.Types.ObjectId;
  siteId?: mongoose.Types.ObjectId;
  dailyRate: number;
  overtimeRate: number;
  monthlyFixedSalary: number;
  standardShiftHours: number;
  isActive: boolean;
}

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: "Site", default: null },
    dailyRate: { type: Number, required: true, default: 0 },
    overtimeRate: { type: Number, required: true, default: 0 },
    monthlyFixedSalary: { type: Number, required: true, default: 0 },
    standardShiftHours: { type: Number, required: true, default: 9 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SalaryStructureSchema.index({ userId: 1, isActive: 1 });

const SalaryStructure = models.SalaryStructure || mongoose.model<ISalaryStructure>("SalaryStructure", SalaryStructureSchema);
export default SalaryStructure;
