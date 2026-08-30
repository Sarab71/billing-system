import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Transaction from "@/app/models/Transactions";
import Customer from "@/app/models/Customer";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET SINGLE TRANSACTION
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const transaction = await Transaction.findById(id)
      .populate("customer")
      .populate("relatedBill");

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("GET transaction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch transaction",
      },
      { status: 500 }
    );
  }
}

// UPDATE TRANSACTION
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 }
      );
    }

    const oldCustomerId = transaction.customer.toString();
    const oldAmount = Number(transaction.amount);
    const oldType = transaction.type;

    const newCustomerId = body.customer || oldCustomerId;
    const newType = body.type || oldType;
    const newAmount =
      body.amount !== undefined
        ? Number(body.amount)
        : oldAmount;

    if (newType !== "debit" && newType !== "credit") {
      return NextResponse.json(
        {
          success: false,
          message: "Type must be debit or credit",
        },
        { status: 400 }
      );
    }

    if (newAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    // Reverse old transaction from old customer
    const oldBalanceChange =
      oldType === "debit" ? -oldAmount : oldAmount;

    await Customer.findByIdAndUpdate(
      oldCustomerId,
      {
        $inc: {
          balance: oldBalanceChange,
        },
      }
    );

    // Apply new transaction to new customer
    const newBalanceChange =
      newType === "debit" ? newAmount : -newAmount;

    const newCustomer = await Customer.findByIdAndUpdate(
      newCustomerId,
      {
        $inc: {
          balance: newBalanceChange,
        },
      },
      { new: true }
    );

    if (!newCustomer) {
      // Ideally we should restore old balance here,
      // but this validation normally prevents issues.
      return NextResponse.json(
        {
          success: false,
          message: "New customer not found",
        },
        { status: 404 }
      );
    }

    // Update transaction
    const updatedTransaction =
      await Transaction.findByIdAndUpdate(
        id,
        {
          ...(body.customer !== undefined && {
            customer: body.customer,
          }),

          ...(body.type !== undefined && {
            type: body.type,
          }),

          ...(body.amount !== undefined && {
            amount: Number(body.amount),
          }),

          ...(body.date !== undefined && {
            date: new Date(body.date),
          }),

          ...(body.description !== undefined && {
            description: body.description,
          }),

          ...(body.relatedBill !== undefined && {
            relatedBill: body.relatedBill,
          }),

          ...(body.invoiceNumber !== undefined && {
            invoiceNumber: body.invoiceNumber,
          }),
        },
        {
          new: true,
          runValidators: true,
        }
      );

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("PUT transaction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update transaction",
      },
      { status: 500 }
    );
  }
}

// DELETE TRANSACTION
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 }
      );
    }

    const customerId = transaction.customer.toString();
    const amount = Number(transaction.amount);

    // Reverse transaction effect
    const reverseBalanceChange =
      transaction.type === "debit"
        ? -amount
        : amount;

    await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: {
          balance: reverseBalanceChange,
        },
      }
    );

    await Transaction.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("DELETE transaction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete transaction",
      },
      { status: 500 }
    );
  }
}