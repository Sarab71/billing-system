import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Transaction from "@/app/models/Transactions";
import Customer from "@/app/models/Customer";

// ==================================================
// GET TRANSACTIONS
// ==================================================

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const customerId = searchParams.get("customerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // ==================================================
    // BASE FILTER
    // ==================================================

    const filter: Record<string, unknown> = {};

    if (customerId) {
      filter.customer = customerId;
    }

    // ==================================================
    // OPENING BALANCE
    // ==================================================

    let openingBalance = 0;

    if (customerId && startDate) {
      const start = new Date(startDate);

      // Transactions BEFORE selected start date
      const previousTransactions = await Transaction.find({
        customer: customerId,
        date: {
          $lt: start,
        },
      }).select("type amount");

      for (const transaction of previousTransactions) {
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "debit") {
          openingBalance += amount;
        } else if (transaction.type === "credit") {
          openingBalance -= amount;
        }
      }
    }

    // ==================================================
    // DATE FILTER
    // ==================================================

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};

      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);

        // Include complete end date
        end.setHours(23, 59, 59, 999);

        dateFilter.$lte = end;
      }

      filter.date = dateFilter;
    }

    // ==================================================
    // FETCH TRANSACTIONS
    // ==================================================

    const transactions = await Transaction.find(filter)
      .populate("customer")
      .populate("relatedBill")
      .sort({
        date: 1,
        createdAt: 1,
      });

    return NextResponse.json(
      {
        success: true,
        transactions,
        openingBalance,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET transactions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch transactions",
      },
      {
        status: 500,
      }
    );
  }
}

// ==================================================
// CREATE TRANSACTION / PAYMENT
// ==================================================

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
        {
          status: 400,
        }
      );
    }

    if (type !== "debit" && type !== "credit") {
      return NextResponse.json(
        {
          success: false,
          message: "Type must be either debit or credit",
        },
        {
          status: 400,
        }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    const existingCustomer =
      await Customer.findById(customer);

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        {
          status: 404,
        }
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

    // ==================================================
    // UPDATE CUSTOMER BALANCE
    // ==================================================

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
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST transaction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create transaction",
      },
      {
        status: 500,
      }
    );
  }
}