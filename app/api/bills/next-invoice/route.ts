import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Bill from "@/app/models/Bill";

export async function GET() {
  try {
    await connectDB();

    const lastBill = await Bill.findOne()
      .sort({ invoiceNumber: -1 })
      .select("invoiceNumber");

    const nextInvoiceNumber = lastBill
      ? lastBill.invoiceNumber + 1
      : 1001;

    return NextResponse.json({
      success: true,
      nextInvoiceNumber,
    });
  } catch (error) {
    console.error("GET next invoice number error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get next invoice number",
      },
      { status: 500 }
    );
  }
}