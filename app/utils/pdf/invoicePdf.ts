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

// ==================================================
// LOAD FONT
// ==================================================

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

  doc.setFont("NotoSans", "normal");
};

// ==================================================
// CALCULATE ITEM TOTAL
// ==================================================

const calculateItemTotal = (item: InvoiceItem) => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const discount = Number(item.discount) || 0;

  const subtotal = qty * rate;

  const discountAmount =
    (subtotal * discount) / 100;

  return Math.round(subtotal - discountAmount);
};

// ==================================================
// FORMAT DATE
// Example: 31/AUG/2026
// ==================================================

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  const month = parsedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
    }
  );

  const year = parsedDate.getFullYear();

  return `${day}/${month}/${year}`;
};

// ==================================================
// GENERATE INVOICE PDF
// ==================================================

export const generateInvoicePdf = async ({
  invoiceNumber,
  billDate,
  customer,
  items,
  totalQuantity,
  grandTotal,
}: GenerateInvoicePdfProps) => {
  const doc = new jsPDF();

  // Load ₹ supported font
  await loadFont(doc);

  // ==================================================
  // COMPANY DETAILS
  // ==================================================

  const companyName = "VISION VAULT";
  const companyPhone = "+91 9319747717";

  // ==================================================
  // HEADER
  // ==================================================

  let y = 13;

  // --------------------------------------------------
  // COMPANY NAME
  // --------------------------------------------------

  doc.setFontSize(20);
  doc.setFont("NotoSans", "normal");

  doc.text(
    companyName,
    105,
    y,
    {
      align: "center",
    }
  );

  // --------------------------------------------------
  // RECEIPT
  // --------------------------------------------------

  y += 6;

  doc.setFontSize(15);

  doc.text(
    "RECEIPT",
    105,
    y,
    {
      align: "center",
    }
  );

  // ==================================================
  // LEFT SIDE - COMPANY / INVOICE DETAILS
  // ==================================================

  const leftX = 14;
  const rightX = 196;

  let detailsY = 35;

  doc.setFontSize(8.5);
  doc.setFont("NotoSans", "normal");

  // --------------------------------------------------
  // LEFT SIDE
  // --------------------------------------------------

  doc.text(
    `Phone: ${companyPhone}`,
    leftX,
    detailsY
  );

  doc.text(
    `Receipt #: ${invoiceNumber}`,
    leftX,
    detailsY + 6
  );

  doc.text(
    `Date: ${formatDate(billDate)}`,
    leftX,
    detailsY + 12
  );

  // --------------------------------------------------
  // RIGHT SIDE - BILL TO
  // --------------------------------------------------

  doc.text(
    "Bill To:",
    rightX,
    detailsY,
    {
      align: "right",
    }
  );

  doc.text(
    customer.name,
    rightX,
    detailsY + 4,
    {
      align: "right",
    }
  );

  // Customer Address
  const customerAddressLines = doc.splitTextToSize(
    `Address:\n${customer.address || "-"}`,
    90
  );

  doc.text(
    customerAddressLines,
    rightX,
    detailsY + 12,
    {
      align: "right",
    }
  );

  // ==================================================
  // HEADER BOTTOM POSITION
  // ==================================================

  const addressHeight =
    customerAddressLines.length * 4;

  const headerBottomY =
    Math.max(
      detailsY + 12,
      detailsY + 12 + addressHeight
    ) + 5;

  doc.setLineWidth(0.4);

  doc.line(
    14,
    headerBottomY,
    196,
    headerBottomY
  );

  // ==================================================
  // ITEMS TABLE
  // ==================================================

  const tableRows = items.map(
    (item, index) => [
      String(index + 1),

      item.model,

      String(item.qty),

      `₹${Number(
        item.rate
      ).toLocaleString("en-IN")}`,

      `${Number(item.discount) || 0}%`,

      `₹${calculateItemTotal(
        item
      ).toLocaleString("en-IN")}`,
    ]
  );
  autoTable(doc, {
    startY: headerBottomY + 6,

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
      lineWidth: 0.2,
      halign: "center",
      valign: "middle",
    },

    headStyles: {
      font: "NotoSans",
      fontStyle: "normal",
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },

    columnStyles: {
      0: {
        cellWidth: 12,
        halign: "center",
      },

      1: {
        cellWidth: 62,
        halign: "center",
      },

      2: {
        cellWidth: 20,
        halign: "center",
      },

      3: {
        cellWidth: 30,
        halign: "center",
      },

      4: {
        cellWidth: 28,
        halign: "center",
      },

      5: {
        cellWidth: 35,
        halign: "center",
      },
    },

    margin: {
      left: 14,
      right: 14,
    },
  });

  // ==================================================
  // TOTALS
  // ==================================================

  const finalY =
    (
      doc as unknown as {
        lastAutoTable: {
          finalY: number;
        };
      }
    ).lastAutoTable.finalY;

  // Total Quantity
  doc.setFontSize(10);

  doc.text(
    `Total Quantity: ${totalQuantity}`,
    140,
    finalY + 10
  );

  // Grand Total
  doc.setFontSize(13);

  doc.text(
    `Grand Total: ₹${Number(grandTotal).toLocaleString("en-IN")}`,
    140,
    finalY + 19
  );

  // ==================================================
  // FOOTER LINE
  // ==================================================

  doc.setLineWidth(0.3);

  doc.line(
    14,
    finalY + 26,
    196,
    finalY + 26
  );

  // ==================================================
  // FOOTER
  // ==================================================

  doc.setFontSize(8);

  doc.text(
    "Thank you for your business!",
    105,
    finalY + 33,
    {
      align: "center",
    }
  );

  // ==================================================
  // DOWNLOAD
  // ==================================================

  doc.save(
    `Invoice-${invoiceNumber}.pdf`
  );
};