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
  <aside
    className="
      flex
      min-h-[calc(100vh-64px)]
      w-32
      shrink-0
      flex-col
      self-stretch
      bg-linear-to-b
      from-blue-700
      to-blue-800
      p-2
      sm:w-44
      sm:p-3
      lg:w-64
      lg:p-4
    "
  >
    <h1 className="mb-2 truncate text-sm font-bold text-white sm:mb-3 sm:text-lg lg:mb-4 lg:text-xl">
      Customers
    </h1>

    {/* Search */}
    <div className="relative mb-3 lg:mb-4">
      <Search
        size={16}
        className="
          pointer-events-none
          absolute
          left-2
          top-1/2
          -translate-y-1/2
          text-blue-200
          sm:left-3
        "
      />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="
          w-full
          rounded-md
          bg-white/15
          py-2
          pr-2
          pl-8
          text-xs
          text-white
          outline-none
          placeholder:text-blue-200
          focus:bg-white/20
          focus:ring-2
          focus:ring-white/30
          sm:py-2.5
          sm:pl-9
          sm:text-sm
          lg:pl-10
        "
      />
    </div>

    {/* Customer List */}
    <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 sm:pr-1">
      {loadingCustomers ? (
        <div className="flex justify-center py-8">
          <Loader2
            size={20}
            className="animate-spin text-white"
          />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-xs text-blue-100 sm:text-sm">
          No customers found
        </p>
      ) : filteredCustomers.length === 0 ? (
        <p className="py-4 text-center text-xs text-blue-100 sm:text-sm">
          No customer found
        </p>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filteredCustomers.map((customer) => (
            <button
              key={customer._id}
              type="button"
              onClick={() => onSelectCustomer(customer)}
              className={`
                w-full
                cursor-pointer
                rounded-md
                px-2
                py-2
                text-left
                text-xs
                font-medium
                transition
                sm:px-3
                sm:py-2.5
                sm:text-sm
                lg:text-base
                ${
                  selectedCustomer?._id === customer._id
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-blue-600/70 text-blue-100 hover:bg-blue-600"
                }
              `}
            >
              <p className="truncate">
                {customer.name}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-blue-200 sm:text-xs">
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