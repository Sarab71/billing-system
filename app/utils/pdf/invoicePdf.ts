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

  return subtotal - discountAmount;
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

  let leftY = 35;

  doc.setFontSize(8.5);
  doc.setFont("NotoSans", "normal");

  // Phone
  leftY += 6;

  doc.text(
    `Phone: ${companyPhone}`,
    leftX,
    leftY
  );

  // Receipt Number
  leftY += 6;

  doc.text(
    `Receipt #: ${invoiceNumber}`,
    leftX,
    leftY
  );

  // Date
  leftY += 6;

  doc.text(
    `Date: ${formatDate(billDate)}`,
    leftX,
    leftY
  );

  // ==================================================
  // RIGHT SIDE - BILL TO
  // ==================================================

  const rightX = 196;

  let rightY = 35;

  doc.setFontSize(8.5);
  doc.setFont("NotoSans", "normal");

  // Customer Name
doc.text(
  `Bill To:\n${customer.name}`,
  rightX,
  rightY,
  {
    align: "right",
  }
);

// Customer Address
rightY += 10;

const customerAddressLines = doc.splitTextToSize(
  `Address:\n${customer.address || "-"}`,
  90
);

doc.text(
  customerAddressLines,
  rightX,
  rightY,
  {
    align: "right",
  }
);

  // ==================================================
  // HORIZONTAL LINE
  // ==================================================

  const headerBottomY =
    Math.max(
      leftY,
      rightY +
      customerAddressLines.length * 4
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
    },

    headStyles: {
      font: "NotoSans",
      fontStyle: "normal",
      fontSize: 9,
    },

    columnStyles: {
      0: {
        cellWidth: 12,
        halign: "center",
      },

      1: {
        cellWidth: 62,
      },

      2: {
        cellWidth: 20,
        halign: "center",
      },

      3: {
        cellWidth: 30,
        halign: "right",
      },

      4: {
        cellWidth: 28,
        halign: "right",
      },

      5: {
        cellWidth: 35,
        halign: "right",
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