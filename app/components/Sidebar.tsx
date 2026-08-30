"use client";

import { useEffect, useState, useCallback } from "react";
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

  const fetchDueBills = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/bills/due", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBills(data.bills || []);
      } else {
        setBills([]);
        console.error(
          data.message || "Failed to fetch due bills"
        );
      }
    } catch (error) {
      console.error("Fetch due bills error:", error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueBills();

    const handleFocus = () => {
      fetchDueBills();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [fetchDueBills]);

  return (
    <aside
      className="
      h-[calc(100vh-64px)]
      w-40
      shrink-0
      overflow-hidden
      border-r
      border-gray-200
      bg-white
      sm:w-52
      md:w-60
      lg:w-72
    "
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3 sm:px-4 sm:py-4">
        <h2 className="text-xs font-semibold text-gray-800 sm:text-sm lg:text-base">
          Today&apos;s Due
        </h2>

        {!loading && bills.length > 0 && (
          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 sm:px-2 sm:text-xs">
            {bills.length}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-40 items-center justify-center px-3">
          <p className="text-xs text-gray-400 sm:text-sm">
            Loading...
          </p>
        </div>
      ) : bills.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-40 flex-col items-center justify-center px-3 text-center sm:px-4 lg:min-h-56">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
            <CalendarDays
              size={20}
              className="text-blue-600 sm:h-5.75 sm:w-5.75"
            />
          </div>

          <p className="mt-3 text-xs font-medium text-gray-700 sm:text-sm lg:mt-4">
            No due bills today
          </p>

          <p className="mt-1 text-[10px] leading-4 text-gray-400 sm:text-xs sm:leading-5">
            Upcoming payments and due bills will appear here.
          </p>
        </div>
      ) : (
        /* Due Bills */
        <div className="h-[calc(100vh-120px)] overflow-y-auto p-2 sm:p-3">
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
                  onClick={() =>
                    router.push(`/edit-bill/${bill._id}`)
                  }
                  className="
                  w-full
                  cursor-pointer
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  p-2
                  text-left
                  transition
                  hover:border-blue-200
                  hover:bg-blue-50
                  sm:p-3
                "
                >
                  <div className="flex items-start justify-between gap-1 sm:gap-2">
                    <p className="min-w-0 truncate text-[11px] font-semibold text-gray-800 sm:text-sm">
                      {customerName}
                    </p>

                    <span className="shrink-0 text-[9px] text-gray-400 sm:text-xs">
                      #{bill.invoiceNumber}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="text-[9px] text-gray-500 sm:text-xs">
                      Amount
                    </span>

                    <span className="flex shrink-0 items-center text-[11px] font-semibold text-red-600 sm:text-sm">
                      <IndianRupee size={11} />

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