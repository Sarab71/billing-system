"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { useRouter } from "next/navigation";
import DashboardCard from "@/app/components/DashboardCard";
import {
  Wallet,
  CircleDollarSign,
  TrendingUp,
  ReceiptIndianRupee,
  Calendar,
} from "lucide-react";

interface DashboardData {
  totalPayments: number;
  totalSales: number;
  totalExpenses: number;
}

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2, })}`;
};

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const getFirstDayOfMonth = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

export default function Home() {
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  const [dashboard, setDashboard] = useState<DashboardData>({
    totalPayments: 0,
    totalSales: 0,
    totalExpenses: 0,
  });

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (startDate) {
        params.set("startDate", startDate);
      }

      if (endDate) {
        params.set("endDate", endDate);
      }

      const response = await fetch(
        `/api/dashboard?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error(
          data.message || "Failed to fetch dashboard data"
        );
        return;
      }

      setDashboard({
        totalPayments: Number(
          data.dashboard.totalPayments || 0
        ),
        totalSales: Number(
          data.dashboard.totalSales || 0
        ),
        totalExpenses: Number(
          data.dashboard.totalExpenses || 0
        ),
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);

  const totalOutstanding = Math.max(
    dashboard.totalSales - dashboard.totalPayments,
    0
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Today's Due Sidebar */}
        <Sidebar />

        {/* Main Dashboard */}
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                Welcome to Billing System
              </h1>

              <p className="mt-2 text-sm text-gray-500 sm:text-base">
                Manage your customers, bills, payments and expenses
              </p>
            </div>

            {/* Date Filters */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {/* Start Date */}
              <div className="w-full sm:w-auto">
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  Start Date
                </label>

                <div className="relative">
                  <Calendar
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-3 pl-10 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="w-full sm:w-auto">
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  End Date
                </label>

                <div className="relative">
                  <Calendar
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    max={getToday()}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-3 pl-10 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Dashboard Cards */}
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                title="Total Outstanding"
                value={
                  loading
                    ? "Loading..."
                    : formatCurrency(totalOutstanding)
                }
                subtitle="Sales minus payments received"
                onClick={() => router.push("/outstanding")}
                icon={<Wallet size={23} className="text-blue-600" />}
              />

              <DashboardCard
                title="Payments Received"
                value={
                  loading
                    ? "Loading..."
                    : formatCurrency(dashboard.totalPayments)
                }
                subtitle="Payments received in selected period"
                onClick={() => router.push("/payments")}
                icon={
                  <CircleDollarSign
                    size={23}
                    className="text-green-600"
                  />
                }
              />

              <DashboardCard
                title="Total Sales"
                value={
                  loading
                    ? "Loading..."
                    : formatCurrency(dashboard.totalSales)
                }
                subtitle="Total sales in selected period"
                onClick={() => router.push("/sales")}
                icon={
                  <TrendingUp
                    size={23}
                    className="text-purple-600"
                  />
                }
              />

              <DashboardCard
                title="Expenses"
                value={
                  loading
                    ? "Loading..."
                    : formatCurrency(dashboard.totalExpenses)
                }
                subtitle="Total expenses in selected period"
                onClick={() => router.push("/expenses")}
                icon={
                  <ReceiptIndianRupee
                    size={23}
                    className="text-red-600"
                  />
                }
              />
            </div>

            {/* Future Dashboard Section */}
            <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <h2 className="text-base font-semibold text-gray-700">
                Business Overview
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Sales reports and analytics will appear here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>

  );
}