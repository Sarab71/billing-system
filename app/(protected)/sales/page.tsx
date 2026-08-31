"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  IndianRupee,
  Search,
  Eye,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CustomerSidebar from "@/app/components/CustomerSidebar";


interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface BillItem {
  modelNumber: string;
  quantity?: number;
  rate?: number;
  discount?: number;
  totalAmount?: number;
}

interface Bill {
  _id: string;
  invoiceNumber: number;
  customer: Customer | string;
  date: string;
  totalQty: number;
  grandTotal: number;
  dueDate?: string;
  items?: BillItem[];
}

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function SalesPage() {
  const router = useRouter();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/bills");
        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to fetch sales");
          return;
        }

        setBills(data.bills || []);
      } catch (error) {
        console.error("Fetch sales error:", error);
        toast.error("Failed to fetch sales");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);

        const response = await fetch("/api/customers");
        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(data.message || "Failed to fetch customers");
          return;
        }

        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Fetch customers error:", error);
        toast.error("Failed to fetch customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const customerName =
        typeof bill.customer === "object"
          ? bill.customer?.name || ""
          : "";

      const customerId =
        typeof bill.customer === "object"
          ? bill.customer?._id
          : bill.customer;

      const searchValue = search.trim().toLowerCase();

      const matchedItems =
        bill.items?.filter((item) =>
          item.modelNumber
            ?.toLowerCase()
            .includes(searchValue)
        ) || [];

      const matchesSearch =
        !searchValue ||
        bill.invoiceNumber
          .toString()
          .includes(searchValue) ||
        customerName
          .toLowerCase()
          .includes(searchValue) ||
        matchedItems.length > 0;

      const billDate = new Date(bill.date);
      billDate.setHours(0, 0, 0, 0);

      let matchesStartDate = true;
      let matchesEndDate = true;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        matchesStartDate = billDate >= start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        matchesEndDate = billDate <= end;
      }

      const matchesCustomer =
        !selectedCustomer ||
        customerId === selectedCustomer._id;

      return (
        matchesSearch &&
        matchesStartDate &&
        matchesEndDate &&
        matchesCustomer
      );
    });
  }, [
    bills,
    search,
    startDate,
    endDate,
    selectedCustomer,
  ]);

  const totalSales = filteredBills.reduce(
    (total, bill) => total + Number(bill.grandTotal || 0),
    0
  );

  return (
    <div className="flex min-h-[calc(100vh-64px)] min-w-0 bg-gray-50">

      {/* LEFT CUSTOMER SIDEBAR */}
      <CustomerSidebar
        customers={customers}
        loadingCustomers={loadingCustomers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={(customer) => {
          setSelectedCustomer(customer);
        }}
      />

      {/* RIGHT SALES CONTENT */}
      <main className="min-w-0 flex-1 bg-gray-50 p-2 sm:p-4 md:p-6">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800 sm:text-xl md:text-2xl">
                Sales
              </h1>

              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                View and manage all sales invoices
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Total Sales
                  </p>

                  <p className="mt-1 text-base font-bold text-gray-800 sm:text-xl">
                    {formatCurrency(totalSales)}
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-2 sm:p-3">
                  <IndianRupee
                    size={20}
                    className="text-green-600 sm:h-5.5 sm:w-5.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:mb-5 sm:p-4">

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">

              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoice or customer..."
                  className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:pl-10 sm:text-sm"
                />
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pr-2 pl-8 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:pl-9 sm:text-sm"
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-2 pr-2 pl-8 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:py-2.5 sm:pl-9 sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                disabled={!startDate && !endDate}
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left sm:min-w-212.5">

                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-[10px] font-semibold uppercase text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
                      Invoice
                    </th>

                    <th className="px-2 py-2 text-[10px] font-semibold uppercase text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
                      Date
                    </th>

                    <th className="px-2 py-2 text-[10px] font-semibold uppercase text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
                      Customer
                    </th>

                    <th className="px-2 py-2 text-[10px] font-semibold uppercase text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
                      Total
                    </th>

                    <th className="px-2 py-2 text-[10px] font-semibold uppercase text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
                      Particulars
                    </th>

                    <th className="px-2 py-2 text-[10px] font-semibold uppercase text-gray-500 sm:px-4 sm:py-3 sm:text-xs">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center sm:py-12"
                      >
                        <Loader2
                          className="mx-auto animate-spin text-blue-600"
                          size={22}
                        />

                        <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                          Loading sales...
                        </p>
                      </td>
                    </tr>

                  ) : filteredBills.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-xs text-gray-500 sm:py-12 sm:text-sm"
                      >
                        No sales found
                      </td>
                    </tr>

                  ) : (

                    filteredBills.map((bill) => {
                      const customerName =
                        typeof bill.customer === "object"
                          ? bill.customer?.name || "Unknown"
                          : "Unknown";

                      return (
                        <tr
                          key={bill._id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >
                          {/* Invoice */}
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <button
                              onClick={() =>
                                router.push(`/edit-bill/${bill._id}`)
                              }
                              className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline sm:text-sm"
                            >
                              #{bill.invoiceNumber}
                            </button>
                          </td>

                          {/* Date */}
                          <td className="px-2 py-2 text-xs text-gray-600 sm:px-4 sm:py-3 sm:text-sm">
                            {new Date(
                              bill.date
                            ).toLocaleDateString("en-IN")}
                          </td>

                          {/* Customer */}
                          <td className="px-2 py-2 text-xs font-medium text-gray-700 sm:px-4 sm:py-3 sm:text-sm">
                            {customerName}
                          </td>

                          {/* Total */}
                          <td className="px-2 py-2 text-xs font-semibold text-gray-800 sm:px-4 sm:py-3 sm:text-sm">
                            {formatCurrency(
                              Number(bill.grandTotal)
                            )}
                          </td>

                          {/* Particulars */}
                          <td className="w-40 px-2 py-2 align-top sm:w-48 sm:px-4 sm:py-3">
                            {bill.items &&
                              bill.items.length > 0 ? (
                              <div className="flex max-h-28 flex-col gap-1 overflow-y-auto sm:max-h-32">
                                {bill.items.map(
                                  (item, index) => {
                                    const isMatched =
                                      search.trim() !== "" &&
                                      item.modelNumber
                                        ?.toLowerCase()
                                        .includes(
                                          search
                                            .trim()
                                            .toLowerCase()
                                        );

                                    return (
                                      <span
                                        key={index}
                                        className={`wrap-break-word text-xs sm:text-sm ${isMatched
                                            ? "font-semibold text-blue-600"
                                            : "text-gray-600"
                                          }`}
                                      >
                                        {item.modelNumber}
                                      </span>
                                    );
                                  }
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 sm:text-sm">
                                -
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <button
                              onClick={() =>
                                router.push(
                                  `/edit-bill/${bill._id}`
                                )
                              }
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-50 px-2 py-1.5 text-[10px] font-medium text-blue-600 transition hover:bg-blue-100 sm:gap-1.5 sm:px-3 sm:text-xs"
                            >
                              <Eye size={13} />
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

          {/* Result count */}
          {!loading && filteredBills.length > 0 && (
            <p className="mt-3 text-xs text-gray-500 sm:text-sm">
              Showing {filteredBills.length} sale
              {filteredBills.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}