// src/models/PublicHoliday.ts
import mongoose, { Schema, Document, models } from "mongoose";

export type HolidayType = "National" | "Regional" | "Religious";

export interface IPublicHoliday extends Document {
  name: string;
  date: Date;
  dateString: string; // Format: YYYY-MM-DD
  type: HolidayType;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PublicHolidaySchema = new Schema<IPublicHoliday>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    dateString: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["National", "Regional", "Religious"],
      required: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Unique compound index so we don't accidentally create duplicate holidays with exact same date & name
PublicHolidaySchema.index({ dateString: 1, name: 1 }, { unique: true });

const PublicHoliday =
  models.PublicHoliday || mongoose.model<IPublicHoliday>("PublicHoliday", PublicHolidaySchema);

export default PublicHoliday;
