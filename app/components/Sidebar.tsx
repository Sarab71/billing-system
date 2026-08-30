"use client";

import { useEffect, useState } from "react";
import { CalendarDays, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";

interface DueBill {
  _id: string;
  invoiceNumber: number;
  grandTotal: number;
  dueDate: string;
  customer:
  | string
  | {
    _id: string;
    name: string;
    phone?: string;
  };
}

export default function Sidebar() {
  const [bills, setBills] = useState<DueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDueBills = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/bills/due");
        const data = await response.json();

        if (response.ok && data.success) {
          setBills(data.bills || []);
        }
      } catch (error) {
        console.error("Fetch due bills error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDueBills();
  }, []);

  return (
    <aside className="w-full border-b border-gray-200 bg-white lg:min-h-[calc(100vh-64px)] lg:w-72 lg:border-r lg:border-b-0">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">
          Today&apos;s Due
        </h2>

        {!loading && bills.length > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            {bills.length}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-56 items-center justify-center px-5">
          <p className="text-sm text-gray-400">
            Loading...
          </p>
        </div>
      ) : bills.length === 0 ? (

        /* Empty State */
        <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <CalendarDays
              size={25}
              className="text-blue-600"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-700">
            No due bills today
          </p>

          <p className="mt-1 max-w-48 text-xs leading-5 text-gray-400">
            Upcoming payments and due bills will appear here.
          </p>
        </div>

      ) : (

        /* Due Bills */
        <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-3">
          <div className="space-y-2">
            {bills.map((bill) => {
              const customerName =
                typeof bill.customer === "object"
                  ? bill.customer.name
                  : "Unknown Customer";

              return (
                <button
                  key={bill._id}
                  type="button"
                  onClick={() => router.push(`/edit-bill/${bill._id}`)}
                  className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">
                      {customerName}
                    </p>

                    <span className="text-xs text-gray-400">
                      #{bill.invoiceNumber}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Bill Amount
                    </span>

                    <span className="flex items-center text-sm font-semibold text-red-600">
                      <IndianRupee size={13} />
                      {Number(
                        bill.grandTotal
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}