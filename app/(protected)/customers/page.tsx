"use client";

import { useEffect, useState } from "react";
import { Calendar, Edit, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CustomerSidebar from "@/app/components/CustomerSidebar";
import EditCustomerForm from "@/app/components/EditCustomerForm";
import { generateStatementPdf } from "@/app/utils/pdf/statementPdf";

interface Customer {
    _id: string;
    name: string;
    phone: string;
    address: string;
    balance: number;
}

interface Transaction {
    _id: string;
    type: "debit" | "credit";
    amount: number;
    date: string;
    description?: string;
    invoiceNumber?: number;
    relatedBill?:
    | string
    | {
        _id: string;
        invoiceNumber?: number;
    };
}

const getToday = () => {
    return new Date().toISOString().split("T")[0];
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB");
};

const formatAmount = (amount: number) => {
    return Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] =
        useState<Customer | null>(null);

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingStatement, setLoadingStatement] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState(getToday());
    const [openingBalance, setOpeningBalance] = useState(0);

    const [editingCustomer, setEditingCustomer] = useState(false);
    const router = useRouter();

    const handleDownloadPDF = async () => {
        if (!selectedCustomer) {
            toast.error("Please select a customer first");
            return;
        }

        try {
            await generateStatementPdf({
                customer: selectedCustomer,
                transactions,
                startDate,
                endDate,
                openingBalance,
            });

            toast.success("Statement downloaded successfully!");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate statement PDF");
        }
    };
    // Fetch customers
    const fetchCustomers = async () => {
        try {
            setLoadingCustomers(true);

            const response = await fetch("/api/customers");
            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.message || "Failed to fetch customers");
                return;
            }

            const customerList = data.customers || [];

            setCustomers(customerList);

            if (customerList.length > 0) {
                setSelectedCustomer(customerList[0]);
            }
        } catch (error) {
            console.error("Fetch customers error:", error);
            toast.error("Failed to fetch customers");
        } finally {
            setLoadingCustomers(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Fetch statement
    const fetchStatement = async () => {
        if (!selectedCustomer) return;

        try {
            setLoadingStatement(true);

            let url =
                "/api/transactions?customerId=" +
                selectedCustomer._id;

            if (startDate) {
                url +=
                    "&startDate=" +
                    encodeURIComponent(startDate);
            }

            if (endDate) {
                url +=
                    "&endDate=" +
                    encodeURIComponent(endDate);
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(
                    data.message ||
                    "Failed to fetch customer statement"
                );
                return;
            }

            setTransactions(data.transactions || []);

            setOpeningBalance(
                Number(data.openingBalance) || 0
            );
        } catch (error) {
            console.error(
                "Fetch statement error:",
                error
            );

            toast.error(
                "Failed to fetch customer statement"
            );
        } finally {
            setLoadingStatement(false);
        }
    };

    useEffect(() => {
        if (selectedCustomer) {
            fetchStatement();
        }
    }, [selectedCustomer, startDate, endDate]);

    // Running balance
    // Running balance
    let runningBalance = openingBalance;

    const statementRows = transactions.map((transaction) => {
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "debit") {
            runningBalance += amount;
        } else if (transaction.type === "credit") {
            runningBalance -= amount;
        }

        return {
            ...transaction,
            runningBalance,
        };
    });
    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50">
            <div className="flex min-h-[calc(100vh-64px)]">

                {/* LEFT CUSTOMER SIDEBAR */}
                <CustomerSidebar
                    customers={customers}
                    loadingCustomers={loadingCustomers}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={(customer) => {
                        setSelectedCustomer(customer);
                        setTransactions([]);
                    }}
                />

                {/* RIGHT SIDE */}
                <main className="min-w-0 flex-1 p-2 sm:p-4 lg:p-6">
                    {!selectedCustomer ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-gray-500">
                                Select a customer to view details
                            </p>
                        </div>
                    ) : editingCustomer ? (
                        <EditCustomerForm
                            customer={selectedCustomer}
                            onClose={() => setEditingCustomer(false)}
                            onUpdated={(updatedCustomer) => {
                                setSelectedCustomer(updatedCustomer);

                                setCustomers((previousCustomers) =>
                                    previousCustomers.map((customer) =>
                                        customer._id === updatedCustomer._id
                                            ? updatedCustomer
                                            : customer
                                    )
                                );
                            }}
                        />
                    ) : (
                        <div className="mx-auto max-w-7xl">

                            {/* PAGE HEADER */}
                            <div className="flex items-center justify-between gap-2">
                                <h1 className="text-base font-bold text-gray-900 sm:text-xl lg:text-2xl">
                                    Customer Details
                                </h1>

                                <button
                                    onClick={() => setEditingCustomer(true)}
                                    className="cursor-pointer flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    <Edit size={16} />
                                    Edit
                                </button>
                            </div>

                            {/* STATEMENT CARD */}
                            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm sm:mt-5 sm:p-4 lg:p-5">

                                <h2 className="text-sm font-bold text-gray-900 sm:text-lg lg:text-xl">
                                    Statement of {selectedCustomer.name}
                                </h2>

                                {/* DATE FILTERS */}
                                <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-end sm:gap-3">

                                    {/* START DATE */}
                                    <div className="min-w-0 flex-1 sm:flex-none">
                                        <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                                            Start Date
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={startDate}
                                                max={endDate || undefined}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 pr-8 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56 sm:px-3 sm:py-2 sm:pr-9 sm:text-sm"
                                            />

                                            <Calendar
                                                size={13}
                                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 sm:right-3 sm:h-4 sm:w-4"
                                            />
                                        </div>
                                    </div>

                                    {/* END DATE */}
                                    <div className="min-w-0 flex-1 sm:flex-none">
                                        <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                                            End Date
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={endDate}
                                                min={startDate || undefined}
                                                max={getToday()}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 pr-8 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56 sm:px-3 sm:py-2 sm:pr-9 sm:text-sm"
                                            />

                                            <Calendar
                                                size={13}
                                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 sm:right-3 sm:h-4 sm:w-4"
                                            />
                                        </div>
                                    </div>

                                    {/* CLEAR FILTER */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStartDate("");
                                            setEndDate("");
                                        }}
                                        disabled={!startDate && !endDate}
                                        className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                                    >
                                        Clear
                                    </button>

                                </div>

                                {/* TABLE */}
                                <div className="mt-3 overflow-x-auto sm:mt-5">
                                    <table className="min-w-175 w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-400 px-2 py-1.5 text-left text-xs font-semibold text-gray-800 sm:px-3 sm:py-2 sm:text-sm">
                                                    Date
                                                </th>

                                                <th className="border border-gray-400 px-2 py-1.5 text-left text-xs font-semibold text-gray-800 sm:px-3 sm:py-2 sm:text-sm">
                                                    Particulars
                                                </th>

                                                <th className="border border-gray-400 px-2 py-1.5 text-right text-xs font-semibold text-gray-800 sm:px-3 sm:py-2 sm:text-sm">
                                                    Debit (₹)
                                                </th>

                                                <th className="border border-gray-400 px-2 py-1.5 text-right text-xs font-semibold text-gray-800 sm:px-3 sm:py-2 sm:text-sm">
                                                    Credit (₹)
                                                </th>

                                                <th className="border border-gray-400 px-2 py-1.5 text-right text-xs font-semibold text-gray-800 sm:px-3 sm:py-2 sm:text-sm">
                                                    Balance (₹)
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loadingStatement ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="border border-gray-300 py-6 text-center sm:py-8"
                                                    >
                                                        <Loader2
                                                            size={20}
                                                            className="mx-auto animate-spin text-blue-600"
                                                        />
                                                    </td>
                                                </tr>
                                            ) : statementRows.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="border border-gray-300 py-6 text-center text-xs text-gray-400 sm:py-8 sm:text-sm"
                                                    >
                                                        No transactions found
                                                    </td>
                                                </tr>
                                            ) : (
                                                statementRows.map((transaction) => (
                                                    <tr
                                                        key={transaction._id}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        {/* DATE */}
                                                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5 text-xs text-gray-700 sm:px-3 sm:py-2 sm:text-sm">
                                                            {formatDate(transaction.date)}
                                                        </td>

                                                        {/* PARTICULARS */}
                                                        <td className="border border-gray-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm">
                                                            {transaction.invoiceNumber &&
                                                                transaction.relatedBill ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const relatedBill =
                                                                            transaction.relatedBill;

                                                                        if (!relatedBill) {
                                                                            toast.error("Bill ID not found");
                                                                            return;
                                                                        }

                                                                        const billId =
                                                                            typeof relatedBill === "string"
                                                                                ? relatedBill
                                                                                : relatedBill._id;

                                                                        router.push(
                                                                            `/edit-bill/${billId}`
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                                >
                                                                    Invoice #
                                                                    {transaction.invoiceNumber}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        router.push(
                                                                            `/edit-payment/${transaction._id}`
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer font-medium text-green-600 hover:text-green-800 hover:underline"
                                                                >
                                                                    {transaction.description ||
                                                                        "Payment"}
                                                                </button>
                                                            )}
                                                        </td>

                                                        {/* DEBIT */}
                                                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5 text-right text-xs text-gray-700 sm:px-3 sm:py-2 sm:text-sm">
                                                            {transaction.type === "debit"
                                                                ? formatAmount(transaction.amount)
                                                                : ""}
                                                        </td>

                                                        {/* CREDIT */}
                                                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5 text-right text-xs text-gray-700 sm:px-3 sm:py-2 sm:text-sm">
                                                            {transaction.type === "credit"
                                                                ? formatAmount(transaction.amount)
                                                                : ""}
                                                        </td>

                                                        {/* BALANCE */}
                                                        <td className="whitespace-nowrap border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-800 sm:px-3 sm:py-2 sm:text-sm">
                                                            {formatAmount(
                                                                transaction.runningBalance
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* DOWNLOAD BUTTON */}
                                <button
                                    type="button"
                                    onClick={handleDownloadPDF}
                                    disabled={
                                        !selectedCustomer ||
                                        transactions.length === 0
                                    }
                                    className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:px-4 sm:text-sm"
                                >
                                    <Download size={15} />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}