import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Customer from "@/app/models/Customer";
import Bill from "@/app/models/Bill";
import Transaction from "@/app/models/Transactions";
import Expense from "@/app/models/Expense";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Date filter
    const dateFilter: Record<string, unknown> = {};

    if (startDate || endDate) {
      const date: Record<string, Date> = {};

      if (startDate) {
        date.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }

      if (endDate) {
        date.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }

      dateFilter.date = date;
    }

    // Total outstanding is always current customer balance
    

    // Payments received in selected date range
    const paymentResult = await Transaction.aggregate([
      {
        $match: {
          type: "credit",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    // Total sales in selected date range
    const salesResult = await Bill.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$grandTotal",
          },
        },
      },
    ]);

    // Total expenses in selected date range
    const expenseResult = await Expense.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalPayments =
      paymentResult.length > 0
        ? Number(paymentResult[0].total)
        : 0;

    const totalSales =
      salesResult.length > 0
        ? Number(salesResult[0].total)
        : 0;

    const totalExpenses =
      expenseResult.length > 0
        ? Number(expenseResult[0].total)
        : 0;

    return NextResponse.json({
      success: true,

      dashboard: {
        totalPayments,
        totalSales,
        totalExpenses,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}