import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Expense from "@/app/models/Expense";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET single expense
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("GET expense error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch expense",
      },
      { status: 500 }
    );
  }
}

// UPDATE expense
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const { description, amount, date, categoryId } = body;

    const updateData: {
      description?: string;
      amount?: number;
      date?: Date;
      categoryId?: string;
    } = {};

    if (description !== undefined) {
      updateData.description = description;
    }

    if (amount !== undefined) {
      if (Number(amount) < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Amount cannot be negative",
          },
          { status: 400 }
        );
      }

      updateData.amount = Number(amount);
    }

    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("PUT expense error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update expense",
      },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("DELETE expense error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete expense",
      },
      { status: 500 }
    );
  }
}