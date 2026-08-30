import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Bill from "@/app/models/Bill";
import Customer from "@/app/models/Customer";

export async function GET() {
  try {
    await connectDB();

    // Ensure Customer model is registered
    void Customer;

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
      .populate({
        path: "customer",
        model: Customer,
        select: "name phone",
      })
      .sort({ dueDate: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        bills,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET due bills error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch due bills",
      },
      {
        status: 500,
      }
    );
  }
}