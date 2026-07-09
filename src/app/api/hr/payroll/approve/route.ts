// src/app/api/hr/payroll/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { connectToDatabase } from "@/lib/mongodb";
import PayrollRecord from "@/models/PayrollRecord";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();

    // Verify user role if auth token is present
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    let approvedBy = "HR Admin";

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
        const { payload } = await jose.jwtVerify(token, secret);
        const role = String(payload.role || "").split("_")[0];
        if (role && !["Admin", "Super", "HR"].includes(role)) {
          return NextResponse.json(
            { error: "Forbidden: Only Admin or HR roles can lock payroll records." },
            { status: 403 }
          );
        }
        if (payload.email) {
          approvedBy = String(payload.email);
        }
      } catch {
        // Token parse failed - continue as fallback for dev mode
      }
    }

    const body = await req.json();
    const { periodMonth, userId } = body;

    if (!periodMonth) {
      return NextResponse.json({ error: "periodMonth is required" }, { status: 400 });
    }

    const filter: any = { periodMonth, status: { $ne: "APPROVED_LOCKED" } };
    if (userId) {
      filter.userId = userId;
    }

    const updateResult = await PayrollRecord.updateMany(filter, {
      $set: {
        status: "APPROVED_LOCKED",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully locked ${updateResult.modifiedCount} payroll records.`,
        lockedCount: updateResult.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT Payroll Approve Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
