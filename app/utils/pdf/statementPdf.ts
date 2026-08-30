import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface StatementCustomer {
  _id?: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
}

export interface StatementTransaction {
  _id?: string;
  date: string;
  type: "debit" | "credit";
  amount: number;
  invoiceNumber?: number;
  description?: string;
}

interface GenerateStatementPdfProps {
  customer: StatementCustomer;
  transactions: StatementTransaction[];
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

export const generateStatementPdf = async ({
  customer,
  transactions,
}: GenerateStatementPdfProps) => {
  const doc = new jsPDF();

  // Load ₹ supported font
  await loadFont(doc);

  // =====================
  // HEADING
  // =====================

  doc.setFontSize(18);
  doc.text("Customer Statement", 14, 18);

  // =====================
  // CUSTOMER DETAILS
  // =====================

  doc.setFontSize(11);

  doc.text(
    `Customer: ${customer.name}`,
    14,
    30
  );

  doc.text(
    `Phone: ${customer.phone || "-"}`,
    14,
    37
  );

  const addressLines = doc.splitTextToSize(
    `Address: ${customer.address || "-"}`,
    120
  );

  doc.text(addressLines, 14, 44);

  // =====================
  // CURRENT BALANCE
  // =====================

  doc.setFontSize(12);

  doc.text(
    `Current Balance: ₹${Number(
      customer.balance || 0
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    14,
    58
  );

  // =====================
  // SORT TRANSACTIONS
  // =====================

  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime()
  );

  // =====================
  // RUNNING BALANCE
  // =====================

  let runningBalance = 0;

  const tableRows = sortedTransactions.map(
    (transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "debit") {
        runningBalance += amount;
      } else if (transaction.type === "credit") {
        runningBalance -= amount;
      }

      return [
        new Date(
          transaction.date
        ).toLocaleDateString("en-IN"),

        transaction.invoiceNumber
          ? `Invoice #${transaction.invoiceNumber}`
          : transaction.description || "Payment",

        transaction.type === "debit"
          ? `₹${amount.toLocaleString("en-IN")}`
          : "-",

        transaction.type === "credit"
          ? `₹${amount.toLocaleString("en-IN")}`
          : "-",

        `₹${runningBalance.toLocaleString("en-IN")}`,
      ];
    }
  );

  // =====================
  // TABLE
  // =====================

  autoTable(doc, {
    startY: 66,

    head: [
      [
        "Date",
        "Particulars",
        "Debit",
        "Credit",
        "Balance",
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
  // DOWNLOAD
  // =====================

  doc.save(
    `${customer.name.replace(/\s+/g, "-")}-statement.pdf`
  );
};