import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Bill from "@/app/models/Bill";
import Customer from "@/app/models/Customer";
import Transaction from "@/app/models/Transactions";

// GET ALL BILLS
export async function GET() {
  try {
    await connectDB();

    const bills = await Bill.find()
      .populate("customer")
      .sort({ invoiceNumber: -1 });

    return NextResponse.json(
      {
        success: true,
        bills,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET bills error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bills",
      },
      { status: 500 }
    );
  }
}

// CREATE NEW BILL
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      invoiceNumber,
      customer,
      date,
      items,
      totalQty,
      grandTotal,
      dueDate,
    } = body;

    // Validation
    if (
      !invoiceNumber ||
      !customer ||
      !items ||
      items.length === 0 ||
      grandTotal === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required bill fields are missing",
        },
        { status: 400 }
      );
    }

    // Check customer
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

    // Create bill
    const bill = await Bill.create({
      invoiceNumber,
      customer,
      date: date ? new Date(date) : new Date(),
      items,
      totalQty,
      grandTotal,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    // Increase customer balance
    existingCustomer.balance += Number(grandTotal);
    await existingCustomer.save();

    // Create transaction
    const transaction = await Transaction.create({
      customer,
      type: "debit",
      amount: Number(grandTotal),
      date: date ? new Date(date) : new Date(),
      description: `Bill #${invoiceNumber} created`,
      relatedBill: bill._id,
      invoiceNumber,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Bill created successfully",
        bill,
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST bill error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create bill",
      },
      { status: 500 }
    );
  }
}