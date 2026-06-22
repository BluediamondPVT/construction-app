import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // Format: YYYY-MM-DD
    punchIn: {
        time: Date | null;
        location: {
            latitude: number | null;
            longitude: number | null;
            address: string | null;
        };
    };
    punchOut: {
        time: Date | null;
        location: {
            latitude: number | null;
            longitude: number | null;
            address: string | null;
        };
    };
    status: "In Progress" | "Present" | "Absent" | "Missed Out";
    isEditedByHR: boolean;
    hrNotes: string;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: String, required: true }, // 2026-06-22

        punchIn: {
            time: { type: Date, default: null },
            location: {
                latitude: { type: Number, default: null },
                longitude: { type: Number, default: null },
                address: { type: String, default: null },
            },
        },

        punchOut: {
            time: { type: Date, default: null },
            location: {
                latitude: { type: Number, default: null },
                longitude: { type: Number, default: null },
                address: { type: String, default: null },
            },
        },

        status: {
            type: String,
            enum: ["In Progress", "Present", "Absent", "Missed Out"],
            default: "Absent"
        },
        isEditedByHR: { type: Boolean, default: false },
        hrNotes: { type: String, default: "" },
    },
    { timestamps: true }
);

// Prevent duplicate attendance records for the same day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);