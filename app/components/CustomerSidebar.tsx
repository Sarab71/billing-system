"use client";

import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface CustomerSidebarProps {
  customers: Customer[];
  loadingCustomers: boolean;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
}

export default function CustomerSidebar({
  customers,
  loadingCustomers,
  selectedCustomer,
  onSelectCustomer,
}: CustomerSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchValue) ||
        customer.phone.toLowerCase().includes(searchValue)
    );
  }, [customers, search]);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-linear-to-b from-blue-700 to-blue-800 p-4">
      <h1 className="mb-4 text-xl font-bold text-white">
        Customers
      </h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-200"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer..."
          className="w-full rounded-md bg-white/15 py-2.5 pr-3 pl-10 text-sm text-white outline-none placeholder:text-blue-200 focus:bg-white/20 focus:ring-2 focus:ring-white/30"
        />
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loadingCustomers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-white" />
          </div>
        ) : customers.length === 0 ? (
          <p className="text-sm text-blue-100">
            No customers found
          </p>
        ) : filteredCustomers.length === 0 ? (
          <p className="py-4 text-center text-sm text-blue-100">
            No customer found
          </p>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((customer) => (
              <button
                key={customer._id}
                onClick={() => onSelectCustomer(customer)}
                className={`w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-base font-medium transition ${
                  selectedCustomer?._id === customer._id
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-blue-600/70 text-blue-100 hover:bg-blue-600"
                }`}
              >
                <p className="truncate">{customer.name}</p>

                <p className="mt-0.5 text-xs text-blue-200">
                  {customer.phone}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}