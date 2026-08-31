"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number;
}

export default function OutstandingPartiesPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/customers");
        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message || "Failed to fetch customers"
          );
          return;
        }

        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Fetch customers error:", error);
        toast.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
  console.log("All customers:", customers);
  console.log(
    "Balances:",
    customers.map((customer) => ({
      name: customer.name,
      balance: customer.balance,
      numericBalance: Number(customer.balance),
    }))
  );
}, [customers]);

  // Only customers with pending balance
  const outstandingCustomers = useMemo(() => {
    return customers.filter(
      (customer) => Number(customer.balance) > 0
    );
  }, [customers]);

  // Search customers
  const filteredCustomers = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) {
      return outstandingCustomers;
    }

    return outstandingCustomers.filter(
      (customer) =>
        customer.name
          .toLowerCase()
          .includes(searchValue) ||
        customer.phone
          ?.toLowerCase()
          .includes(searchValue)
    );
  }, [outstandingCustomers, search]);

  // Total outstanding
  const totalOutstanding = useMemo(() => {
    return outstandingCustomers.reduce(
      (total, customer) =>
        total + (Number(customer.balance) || 0),
      0
    );
  }, [outstandingCustomers]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50">
        <Loader2
          className="animate-spin text-blue-600"
          size={28}
        />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-800">
            Outstanding Parties
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Customers with pending balances
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Total Parties */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users
                  size={20}
                  className="text-blue-600"
                />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Outstanding Parties
                </p>

                <p className="text-xl font-bold text-gray-800">
                  {outstandingCustomers.length}
                </p>
              </div>

            </div>
          </div>

          {/* Total Outstanding */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Wallet
                  size={20}
                  className="text-red-600"
                />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Total Outstanding
                </p>

                <p className="text-xl font-bold text-red-600">
                  ₹
                  {totalOutstanding.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Main Card */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">

          {/* Search */}
          <div className="border-b border-gray-100 p-4">

            <div className="relative max-w-md">

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
                placeholder="Search party..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* Table */}
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">

                <tr>
                  <th className="px-4 py-3">
                    Party
                  </th>

                  <th className="px-4 py-3">
                    Phone
                  </th>

                  <th className="px-4 py-3">
                    Address
                  </th>

                  <th className="px-4 py-3 text-right">
                    Outstanding
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredCustomers.length === 0 ? (

                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      No outstanding parties found
                    </td>
                  </tr>

                ) : (

                  filteredCustomers.map((customer) => (

                    <tr
                      key={customer._id}
                      onClick={() =>
                        router.push(
                          `/customers?customerId=${customer._id}`
                        )
                      }
                      className="cursor-pointer border-b border-gray-100 transition hover:bg-blue-50"
                    >

                      <td className="px-4 py-3">

                        <p className="font-medium text-gray-800">
                          {customer.name}
                        </p>

                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {customer.phone || "-"}
                      </td>

                      <td className="max-w-xs px-4 py-3 text-gray-500">

                        <p className="truncate">
                          {customer.address || "-"}
                        </p>

                      </td>

                      <td className="px-4 py-3 text-right">

                        <span className="font-semibold text-red-600">
                          ₹
                          {Number(
                            customer.balance
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </main>
  );
}