import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Leave from "@/models/Leave";
import User from "@/models/User";

// GET method ko update karo
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const allLeaves = await Leave.find()
      .populate({
        path: "userId",
        select: "name role",
        populate: { path: "role", select: "name" },
      })
      .sort({ date: -1 })
      .lean();

    const formattedLeaves = allLeaves.map((leave: any) => {
      const periodMonth = leave.date ? String(leave.date).slice(0, 7) : "";
      const userIdStr = leave.userId?._id?.toString() || leave.userId?.toString();

      const approvedCountInMonth = allLeaves.filter(
        (l: any) =>
          (l.userId?._id?.toString() || l.userId?.toString()) === userIdStr &&
          l.status === "Approved" &&
          String(l.date).startsWith(periodMonth)
      ).length;

      const isPaidLeaveQuotaUsed = approvedCountInMonth >= 1;

      if (leave.userId && typeof leave.userId === "object") {
        let roleName = "Staff";
        if (leave.userId.role && typeof leave.userId.role === "object" && leave.userId.role.name) {
          roleName = leave.userId.role.name;
        } else if (typeof leave.userId.role === "string") {
          roleName = leave.userId.role;
        }
        return {
          ...leave,
          approvedLeavesThisMonth: approvedCountInMonth,
          isPaidLeaveQuotaUsed,
          payImpactText: isPaidLeaveQuotaUsed
            ? `LWP (${approvedCountInMonth}/1 Quota Used)`
            : "Paid Leave (0/1 Used)",
          userId: {
            ...leave.userId,
            role: roleName,
          },
        };
      }
      return {
        ...leave,
        approvedLeavesThisMonth: approvedCountInMonth,
        isPaidLeaveQuotaUsed,
        payImpactText: isPaidLeaveQuotaUsed
          ? `LWP (${approvedCountInMonth}/1 Quota Used)`
          : "Paid Leave (0/1 Used)",
      };
    });

    return NextResponse.json({ leaves: formattedLeaves }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error fetching leaves", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { leaveId, id, _id, status } = body; // status = "Approved" | "Rejected"
    const targetId = leaveId || id || _id;

    if (!targetId || !status) {
      return NextResponse.json(
        { message: "leaveId and status are required" },
        { status: 400 }
      );
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      targetId,
      { status },
      { new: true }
    ).populate({
      path: "userId",
      select: "name role",
      populate: { path: "role", select: "name" },
    });

    if (!updatedLeave) {
      return NextResponse.json(
        { message: "Leave request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: `Leave ${status} successfully`, leave: updatedLeave },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error updating leave", error: error.message },
      { status: 500 }
    );
  }
}