import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Customer from "@/app/models/Customer";

export async function GET() {
  try {
    await connectDB();

    const customers = await Customer.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      customers: customers,
    });
  } catch (error) {
    console.error("GET customers error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { name, phone, address, balance } = body;

    if (!name || !phone || !address) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, phone and address are required",
        },
        {
          status: 400,
        }
      );
    }

    const customer = await Customer.create({
      name: name,
      phone: phone,
      address: address,
      balance: balance ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        customer: customer,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST customer error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer",
      },
      {
        status: 500,
      }
    );
  }
}