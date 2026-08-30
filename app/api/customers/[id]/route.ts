import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Customer from "@/app/models/Customer";

// PUT - Update Customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const {
      name,
      phone,
      address,
    } = body;

    // Validation
    if (!name || !phone || !address) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, phone and address are required",
        },
        { status: 400 }
      );
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer updated successfully",
        customer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer",
      },
      { status: 500 }
    );
  }
}