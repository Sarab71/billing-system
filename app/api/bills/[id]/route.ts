import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Bill from "@/app/models/Bill";
import Customer from "@/app/models/Customer";
import Transaction from "@/app/models/Transactions";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET SINGLE BILL
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const bill = await Bill.findById(id).populate("customer");

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bill,
    });
  } catch (error) {
    console.error("GET bill error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch bill",
      },
      { status: 500 }
    );
  }
}

// UPDATE BILL
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const oldBill = await Bill.findById(id);

    if (!oldBill) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill not found",
        },
        { status: 404 }
      );
    }

    const oldCustomerId = oldBill.customer.toString();
    const oldGrandTotal = Number(oldBill.grandTotal);

    const {
      invoiceNumber,
      customer,
      date,
      items,
      totalQty,
      grandTotal,
      dueDate,
    } = body;

    const newCustomerId = customer || oldCustomerId;
    const newGrandTotal =
      grandTotal !== undefined
        ? Number(grandTotal)
        : oldGrandTotal;

    // CASE 1: SAME CUSTOMER
    if (newCustomerId.toString() === oldCustomerId) {
      const difference = newGrandTotal - oldGrandTotal;

      await Customer.findByIdAndUpdate(
        oldCustomerId,
        {
          $inc: {
            balance: difference,
          },
        }
      );
    }

    // CASE 2: CUSTOMER CHANGED
    else {
      // Remove old bill amount from old customer
      await Customer.findByIdAndUpdate(
        oldCustomerId,
        {
          $inc: {
            balance: -oldGrandTotal,
          },
        }
      );

      // Add new bill amount to new customer
      const newCustomer = await Customer.findById(newCustomerId);

      if (!newCustomer) {
        return NextResponse.json(
          {
            success: false,
            message: "New customer not found",
          },
          { status: 404 }
        );
      }

      await Customer.findByIdAndUpdate(
        newCustomerId,
        {
          $inc: {
            balance: newGrandTotal,
          },
        }
      );
    }

    // Update bill
    const updatedBill = await Bill.findByIdAndUpdate(
      id,
      {
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(customer !== undefined && { customer }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(items !== undefined && { items }),
        ...(totalQty !== undefined && { totalQty }),
        ...(grandTotal !== undefined && {
          grandTotal: Number(grandTotal),
        }),
        ...(dueDate !== undefined && {
          dueDate: new Date(dueDate),
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Update related transaction
    await Transaction.findOneAndUpdate(
      {
        relatedBill: id,
      },
      {
        customer: newCustomerId,
        amount: newGrandTotal,
        invoiceNumber:
          invoiceNumber !== undefined
            ? invoiceNumber
            : oldBill.invoiceNumber,
        date:
          date !== undefined
            ? new Date(date)
            : oldBill.date,
        description: `Bill #${
          invoiceNumber !== undefined
            ? invoiceNumber
            : oldBill.invoiceNumber
        } updated`,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Bill updated successfully",
      bill: updatedBill,
    });
  } catch (error) {
    console.error("PUT bill error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update bill",
      },
      { status: 500 }
    );
  }
}

// DELETE BILL
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await connectDB();

    const { id } = await params;

    const bill = await Bill.findById(id);

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: "Bill not found",
        },
        { status: 404 }
      );
    }

    const customerId = bill.customer.toString();
    const billAmount = Number(bill.grandTotal);

    // Decrease customer balance
    await Customer.findByIdAndUpdate(
      customerId,
      {
        $inc: {
          balance: -billAmount,
        },
      }
    );

    // Delete related transaction
    await Transaction.deleteOne({
      relatedBill: bill._id,
    });

    // Delete bill
    await Bill.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    console.error("DELETE bill error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete bill",
      },
      { status: 500 }
    );
  }
}