import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Transaction from "@/app/models/Transactions";
import Customer from "@/app/models/Customer";

// GET ALL TRANSACTIONS
export async function GET() {
  try {
    await connectDB();

    const transactions = await Transaction.find()
      .populate("customer")
      .populate("relatedBill")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        transactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET transactions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}

// CREATE TRANSACTION / PAYMENT
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      customer,
      type,
      amount,
      date,
      description,
      relatedBill,
      invoiceNumber,
    } = body;

    if (!customer || !type || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer, type and amount are required",
        },
        { status: 400 }
      );
    }

    if (type !== "debit" && type !== "credit") {
      return NextResponse.json(
        {
          success: false,
          message: "Type must be either debit or credit",
        },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    const existingCustomer = await Customer.findById(customer);

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 }
      );
    }

    const transaction = await Transaction.create({
      customer,
      type,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      description: description || "",
      relatedBill: relatedBill || null,
      invoiceNumber: invoiceNumber ?? null,
    });

    // Update customer balance
    if (type === "debit") {
      existingCustomer.balance += Number(amount);
    } else {
      existingCustomer.balance -= Number(amount);
    }

    await existingCustomer.save();

    return NextResponse.json(
      {
        success: true,
        message: "Transaction created successfully",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST transaction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create transaction",
      },
      { status: 500 }
    );
  }
}