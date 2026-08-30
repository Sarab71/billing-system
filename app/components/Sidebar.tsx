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
    flex
    w-32
    shrink-0
    flex-col
    self-stretch
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
      <div className="flex-none border-b border-gray-100 px-2 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-1">
          <h2 className="min-w-0 truncate text-[10px] font-semibold text-gray-800 sm:text-sm lg:text-base">
            Today&apos;s Due
          </h2>

          {!loading && bills.length > 0 && (
            <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600 sm:px-2 sm:text-xs">
              {bills.length}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center px-2 sm:px-3">
          <p className="text-xs text-gray-400 sm:text-sm">
            Loading...
          </p>
        </div>

      ) : bills.length === 0 ? (

        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center px-2 text-center sm:px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
            <CalendarDays
              size={18}
              className="text-blue-600 sm:h-6 sm:w-6"
            />
          </div>

          <p className="mt-3 text-[10px] font-medium text-gray-700 sm:text-sm lg:mt-4">
            No due bills today
          </p>

          <p className="mt-1 text-[9px] leading-4 text-gray-400 sm:text-xs sm:leading-5">
            Upcoming payments and due bills will appear here.
          </p>
        </div>

      ) : (

        /* Due Bills */
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5 sm:p-3">
          <div className="space-y-1.5 sm:space-y-2">
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
                  overflow-hidden
                  rounded-md
                  border
                  border-gray-200
                  bg-white
                  p-1.5
                  text-left
                  transition
                  hover:border-blue-200
                  hover:bg-blue-50
                  sm:rounded-lg
                  sm:p-3
                "
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="min-w-0 truncate text-[9px] font-semibold text-gray-800 sm:text-sm">
                      {customerName}
                    </p>

                    <span className="shrink-0 text-[8px] text-gray-400 sm:text-xs">
                      #{bill.invoiceNumber}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between gap-1 sm:mt-2">
                    <span className="text-[8px] text-gray-500 sm:text-xs">
                      Amount
                    </span>

                    <span className="flex shrink-0 items-center text-[9px] font-semibold text-red-600 sm:text-sm">
                      <IndianRupee size={10} />

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