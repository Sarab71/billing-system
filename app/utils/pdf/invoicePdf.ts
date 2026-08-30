import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceCustomer {
  _id?: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface InvoiceItem {
  model: string;
  qty: number | "";
  rate: number | "";
  discount?: number | "";
}

interface GenerateInvoicePdfProps {
  invoiceNumber: string | number;
  billDate: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  totalQuantity: number;
  grandTotal: number;
}

const loadFont = async (doc: jsPDF) => {
  const response = await fetch("/fonts/NotoSans-Regular.ttf");

  if (!response.ok) {
    throw new Error("Failed to load font");
  }

  const fontBuffer = await response.arrayBuffer();

  const base64 = btoa(
    new Uint8Array(fontBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  doc.addFileToVFS(
    "NotoSans-Regular.ttf",
    base64
  );

  doc.addFont(
    "NotoSans-Regular.ttf",
    "NotoSans",
    "normal"
  );

  doc.setFont("NotoSans");
};

const calculateItemTotal = (item: InvoiceItem) => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const discount = Number(item.discount) || 0;

  const subtotal = qty * rate;
  const discountAmount = (subtotal * discount) / 100;

  return subtotal - discountAmount;
};

export const generateInvoicePdf = async ({
  invoiceNumber,
  billDate,
  customer,
  items,
  totalQuantity,
  grandTotal,
}: GenerateInvoicePdfProps) => {
  const doc = new jsPDF();

  // Load Unicode font for ₹ symbol
  await loadFont(doc);

  // =====================
  // HEADER
  // =====================

  doc.setFontSize(20);
  doc.text("INVOICE", 14, 18);

  doc.setFontSize(10);

  doc.text(`Invoice No: ${invoiceNumber}`, 14, 30);

  doc.text(
    `Date: ${new Date(billDate).toLocaleDateString("en-IN")}`,
    14,
    37
  );

  // =====================
  // CUSTOMER
  // =====================

  doc.setFontSize(12);
  doc.text("Bill To:", 14, 50);

  doc.setFontSize(10);

  doc.text(
    `Name: ${customer.name}`,
    14,
    57
  );

  doc.text(
    `Phone: ${customer.phone || "-"}`,
    14,
    64
  );

  if (customer.address) {
    const addressLines = doc.splitTextToSize(
      `Address: ${customer.address}`,
      90
    );

    doc.text(addressLines, 14, 71);
  }

  // =====================
  // TABLE
  // =====================

  const tableRows = items.map((item, index) => [
    String(index + 1),
    item.model,
    String(item.qty),
    `₹${Number(item.rate).toLocaleString("en-IN")}`,
    `${Number(item.discount) || 0}%`,
    `₹${calculateItemTotal(item).toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: 85,

    head: [
      [
        "#",
        "Model",
        "Qty",
        "Rate",
        "Discount",
        "Total",
      ],
    ],

    body: tableRows,

    styles: {
      font: "NotoSans",
      fontStyle: "normal",
      fontSize: 9,
      cellPadding: 3,
    },

    headStyles: {
      font: "NotoSans",
      fontStyle: "normal",
    },
  });

  // =====================
  // TOTALS
  // =====================

  const finalY = (
    doc as unknown as {
      lastAutoTable: {
        finalY: number;
      };
    }
  ).lastAutoTable.finalY;

  doc.setFontSize(10);

  doc.text(
    `Total Quantity: ${totalQuantity}`,
    140,
    finalY + 12
  );

  doc.setFontSize(13);

  doc.text(
    `Grand Total: ₹${grandTotal.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    140,
    finalY + 22
  );

  // =====================
  // FOOTER
  // =====================

  doc.setFontSize(9);

  // Download
  doc.save(`Invoice-${invoiceNumber}.pdf`);
};