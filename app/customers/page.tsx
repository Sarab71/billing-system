"use client";

import { useEffect, useState } from "react";
import { Calendar, Edit, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CustomerSidebar from "../components/CustomerSidebar";
import { generateStatementPdf } from "../utils/pdf/statementPdf";

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
                    data.message || "Failed to fetch customer statement"
                );
                return;
            }

            setTransactions(data.transactions || []);
        } catch (error) {
            console.error("Fetch statement error:", error);
            toast.error("Failed to fetch customer statement");
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
    let runningBalance = 0;

    const statementRows = transactions.map((transaction) => {
        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "debit") {
            runningBalance -= amount;
        } else {
            runningBalance += amount;
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
                <main className="flex-1 p-4 sm:p-6">
                    {!selectedCustomer ? (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-gray-500">
                                Select a customer to view details
                            </p>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-7xl">

                            {/* PAGE HEADER */}
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Customer Details
                                </h1>

                                <button
                                    onClick={() =>
                                        toast.info("Edit customer feature coming soon")
                                    }
                                    className="cursor-pointer flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    <Edit size={16} />
                                    Edit
                                </button>
                            </div>

                            {/* STATEMENT CARD */}
                            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

                                <h2 className="text-xl font-bold text-gray-900">
                                    Statement of {selectedCustomer.name}
                                </h2>

                                {/* DATE FILTERS */}
                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                                    {/* START DATE */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Start Date
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) =>
                                                    setStartDate(e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                                            />

                                            <Calendar
                                                size={16}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* END DATE */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            End Date
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) =>
                                                    setEndDate(e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                                            />

                                            <Calendar
                                                size={16}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* TABLE */}
                                <div className="mt-5 overflow-x-auto">
                                    <table className="w-full min-w-175 border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-semibold text-gray-800">
                                                    Date
                                                </th>

                                                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-semibold text-gray-800">
                                                    Particulars
                                                </th>

                                                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-semibold text-gray-800">
                                                    Debit (₹)
                                                </th>

                                                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-semibold text-gray-800">
                                                    Credit (₹)
                                                </th>

                                                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-semibold text-gray-800">
                                                    Balance (₹)
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loadingStatement ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="border border-gray-300 py-8 text-center"
                                                    >
                                                        <Loader2
                                                            size={22}
                                                            className="mx-auto animate-spin text-blue-600"
                                                        />
                                                    </td>
                                                </tr>
                                            ) : statementRows.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="border border-gray-300 py-8 text-center text-sm text-gray-400"
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
                                                        <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700">
                                                            {formatDate(transaction.date)}
                                                        </td>

                                                        {/* PARTICULARS */}
                                                        <td className="border border-gray-300 px-3 py-2 text-sm">
                                                            {transaction.invoiceNumber && transaction.relatedBill ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const relatedBill = transaction.relatedBill;

                                                                        if (!relatedBill) {
                                                                            toast.error("Bill ID not found");
                                                                            return;
                                                                        }

                                                                        const billId =
                                                                            typeof relatedBill === "string"
                                                                                ? relatedBill
                                                                                : relatedBill._id;

                                                                        router.push(`/edit-bill/${billId}`);
                                                                    }}
                                                                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                                >
                                                                    Invoice #{transaction.invoiceNumber}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        router.push(`/edit-payment/${transaction._id}`);
                                                                    }}
                                                                    className="font-medium text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                                                                >
                                                                    {transaction.description || "Payment"}
                                                                </button>
                                                            )}
                                                        </td>

                                                        {/* DEBIT */}
                                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">
                                                            {transaction.type === "debit"
                                                                ? formatAmount(transaction.amount)
                                                                : ""}
                                                        </td>

                                                        {/* CREDIT */}
                                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">
                                                            {transaction.type === "credit"
                                                                ? formatAmount(transaction.amount)
                                                                : ""}
                                                        </td>

                                                        {/* BALANCE */}
                                                        <td className="border border-gray-300 px-3 py-2 text-right text-sm font-medium text-gray-800">
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
                                    disabled={!selectedCustomer || transactions.length === 0}
                                    className="cursor-pointer flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 mt-3"
                                >
                                    <Download size={17} />
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