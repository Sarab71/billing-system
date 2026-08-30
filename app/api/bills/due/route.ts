import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Bill from "@/app/models/Bill";

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bills = await Bill.find({
      dueDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate("customer", "name phone")
      .sort({ dueDate: 1 });

    return NextResponse.json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Get due bills error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch due bills",
      },
      { status: 500 }
    );
  }
}