// src/models/Role.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface IRole extends Document {
  name: string;
  permissions: string[];
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Role = models.Role || mongoose.model<IRole>("Role", RoleSchema);
export default Role;