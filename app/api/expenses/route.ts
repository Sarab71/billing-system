import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Expense from "@/app/models/Expense";

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: Record<string, unknown> = {};

    // Date filter
    if (startDate || endDate) {
      const dateFilter: {
        $gte?: Date;
        $lte?: Date;
      } = {};

      if (startDate) {
        dateFilter.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }

      if (endDate) {
        dateFilter.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }

      filter.date = dateFilter;
    }

    const expenses = await Expense.find(filter)
      .populate("categoryId", "name")
      .sort({
        date: -1,
      });

    return NextResponse.json(
      {
        success: true,
        expenses,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET expenses error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch expenses",
      },
      {
        status: 500,
      }
    );
  }
}

// CREATE expense
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { description, amount, date, categoryId } = body;

    if (!description || amount === undefined || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Description, amount and category are required",
        },
        { status: 400 }
      );
    }

    if (Number(amount) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount cannot be negative",
        },
        { status: 400 }
      );
    }

    const expense = await Expense.create({
      description,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      categoryId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense created successfully",
        expense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST expense error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create expense",
      },
      { status: 500 }
    );
  }
}