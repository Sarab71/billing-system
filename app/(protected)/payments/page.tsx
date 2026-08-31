"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  IndianRupee,
  Search,
  Loader2,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Customer {
  _id: string;
  name: string;
}

interface Transaction {
  _id: string;
  customer: Customer | string;
  type: "debit" | "credit";
  amount: number;
  date: string;
  description?: string;
  invoiceNumber?: number;
}

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function PaymentsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch all transactions
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/transactions");
        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to fetch payments");
          return;
        }

        // Sirf credit transactions = payments
        const payments = (data.transactions || []).filter(
          (transaction: Transaction) =>
            transaction.type === "credit"
        );

        setTransactions(payments);
      } catch (error) {
        console.error("Fetch payments error:", error);
        toast.error("Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return transactions.filter((payment) => {
      const customerName =
        typeof payment.customer === "object"
          ? payment.customer?.name || ""
          : "";

      const description = payment.description || "";

      const searchValue = search.toLowerCase();

      const matchesSearch =
        customerName.toLowerCase().includes(searchValue) ||
        description.toLowerCase().includes(searchValue);

      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);

      let matchesStartDate = true;
      let matchesEndDate = true;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        matchesStartDate = paymentDate >= start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        matchesEndDate = paymentDate <= end;
      }

      return (
        matchesSearch &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [transactions, search, startDate, endDate]);

  const totalPayments = filteredPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View all payments received from customers
          </p>
        </div>

        {/* Summary */}
        <div className="mb-5 max-w-sm">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Payments Received
                </p>

                <p className="mt-1 text-xl font-bold text-gray-800">
                  {formatCurrency(totalPayments)}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <IndianRupee
                  size={22}
                  className="text-green-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

            {/* Search */}
            <div className="relative md:col-span-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search customer or description..."
                className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-10 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Start Date */}
            <div className="relative">
              <Calendar
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-9 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-9 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-162.5 text-left">

              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Description
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center"
                    >
                      <Loader2
                        size={24}
                        className="mx-auto animate-spin text-blue-600"
                      />

                      <p className="mt-2 text-sm text-gray-500">
                        Loading payments...
                      </p>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-sm text-gray-500"
                    >
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const customerName =
                      typeof payment.customer === "object"
                        ? payment.customer?.name || "Unknown"
                        : "Unknown";

                    return (
                      <tr
                        key={payment._id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(
                            payment.date
                          ).toLocaleDateString("en-IN")}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                          {customerName}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.description || "-"}
                        </td>

                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {formatCurrency(
                            Number(payment.amount)
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              router.push(
                                `/edit-payment/${payment._id}`
                              )
                            }
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                          >
                            <CreditCard size={14} />
                            View / Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Count */}
        {!loading && filteredPayments.length > 0 && (
          <p className="mt-3 text-sm text-gray-500">
            Showing {filteredPayments.length} payment
            {filteredPayments.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </main>
  );
}