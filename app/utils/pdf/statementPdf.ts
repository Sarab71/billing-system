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
  startDate?: string;
  endDate?: string;
  openingBalance?: number;
}

// ==================================================
// LOAD FONT
// ==================================================

const loadFont = async (doc: jsPDF) => {
  const response = await fetch(
    "/fonts/NotoSans-Regular.ttf"
  );

  if (!response.ok) {
    throw new Error("Failed to load font");
  }

  const fontBuffer = await response.arrayBuffer();

  const base64 = btoa(
    new Uint8Array(fontBuffer).reduce(
      (data, byte) =>
        data + String.fromCharCode(byte),
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

// ==================================================
// FORMAT DATE
// ==================================================

const formatDate = (date?: string) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

// ==================================================
// GENERATE PDF
// ==================================================

export const generateStatementPdf = async ({
  customer,
  transactions,
  startDate,
  endDate,
  openingBalance = 0,
}: GenerateStatementPdfProps) => {
  const doc = new jsPDF();

  // Load ₹ supported font
  await loadFont(doc);

  // ==================================================
  // COMPANY DETAILS
  // ==================================================

  const companyName = "ABC Company";

  // ==================================================
  // TOP HEADER
  // ==================================================

  let y = 16;

  // Company Name
  doc.setFontSize(15);
  doc.setFont(
    "NotoSans",
    "normal"
  );

  doc.text(
    companyName,
    105,
    y,
    {
      align: "center",
    }
  );

  y += 4;

  // Horizontal line
  doc.setLineWidth(0.5);

  doc.line(
    14,
    y,
    196,
    y
  );

  y += 7;

  // ==================================================
  // CUSTOMER NAME
  // ==================================================

  y += 3;

  doc.setFontSize(13);

  doc.text(
    customer.name,
    105,
    y,
    {
      align: "center",
    }
  );

  // ==================================================
  // CUSTOMER ADDRESS
  // ==================================================

  y += 6;

  doc.setFontSize(9);

  const addressLines =
    doc.splitTextToSize(
      customer.address || "-",
      100
    );

  doc.text(
    addressLines,
    105,
    y,
    {
      align: "center",
    }
  );

  y += addressLines.length * 5;

  // ==================================================
  // STATEMENT TYPE
  // ==================================================

  doc.setFontSize(10);

  doc.text(
    "Customer Statement",
    105,
    y,
    {
      align: "center",
    }
  );

  // ==================================================
  // STATEMENT PERIOD
  // ==================================================

  y += 7;

  let statementPeriod =
    "All Transactions";

  if (startDate && endDate) {
    statementPeriod =
      `${formatDate(startDate)} to ${formatDate(endDate)}`;
  } else if (startDate) {
    statementPeriod =
      `From ${formatDate(startDate)}`;
  } else if (endDate) {
    statementPeriod =
      `Until ${formatDate(endDate)}`;
  }

  doc.setFontSize(9);

  doc.text(
    statementPeriod,
    105,
    y,
    {
      align: "center",
    }
  );

  // ==================================================
  // OPENING BALANCE
  // ==================================================

  y += 7;

  doc.setFontSize(10);

  doc.text(
    `Opening Balance: ₹${Number(
      openingBalance || 0
    ).toLocaleString("en-IN")}`,
    105,
    y,
    {
      align: "center",
    }
  );

  // ==================================================
  // CURRENT BALANCE
  // ==================================================

  y += 7;

  doc.setFontSize(10);

  doc.text(
    `Current Balance: ₹${Number(
      customer.balance || 0
    ).toLocaleString("en-IN")}`,
    105,
    y,
    {
      align: "center",
    }
  );

  // ==================================================
  // SORT TRANSACTIONS
  // ==================================================

  const sortedTransactions =
    [...transactions].sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

  // ==================================================
  // RUNNING BALANCE
  // ==================================================

  let runningBalance =
    Number(openingBalance) || 0;

  const tableRows =
    sortedTransactions.map(
      (transaction) => {
        const amount =
          Number(transaction.amount) || 0;

        if (
          transaction.type === "debit"
        ) {
          runningBalance += amount;
        } else if (
          transaction.type === "credit"
        ) {
          runningBalance -= amount;
        }

        return [
          new Date(
            transaction.date
          ).toLocaleDateString(
            "en-IN"
          ),

          transaction.invoiceNumber
            ? `Invoice #${transaction.invoiceNumber}`
            : transaction.description ||
              "Payment",

          transaction.type ===
          "debit"
            ? `₹${amount.toLocaleString(
                "en-IN"
              )}`
            : "-",

          transaction.type ===
          "credit"
            ? `₹${amount.toLocaleString(
                "en-IN"
              )}`
            : "-",

          `₹${runningBalance.toLocaleString(
            "en-IN"
          )}`,
        ];
      }
    );

  // ==================================================
  // TABLE
  // ==================================================

  autoTable(doc, {
    startY: y + 8,

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

    columnStyles: {
      0: {
        cellWidth: 28,
      },

      1: {
        cellWidth: 65,
      },

      2: {
        cellWidth: 30,
        halign: "right",
      },

      3: {
        cellWidth: 30,
        halign: "right",
      },

      4: {
        cellWidth: 32,
        halign: "right",
      },
    },
  });

  // ==================================================
  // DOWNLOAD
  // ==================================================

  doc.save(
    `${customer.name.replace(
      /\s+/g,
      "-"
    )}-statement.pdf`
  );
};