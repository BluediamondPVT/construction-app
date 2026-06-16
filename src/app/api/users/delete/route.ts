// src/app/api/users/delete/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required for deletion" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and delete the user from MongoDB
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json(
        { message: "User not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User successfully deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("USER DELETION ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}