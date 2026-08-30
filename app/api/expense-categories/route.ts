import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import { ExpenseCategory } from "@/app/models/Expense";

// GET all categories
export async function GET() {
  try {
    await connectDB();

    const categories = await ExpenseCategory.find().sort({
      name: 1,
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("GET categories error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

// CREATE category
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required",
        },
        { status: 400 }
      );
    }

    const existingCategory = await ExpenseCategory.findOne({
      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 409 }
      );
    }

    const category = await ExpenseCategory.create({
      name: name.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Expense category created successfully",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST category error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
      },
      { status: 500 }
    );
  }
}