"use client";

import { useEffect, useState } from "react";
import { Calendar, Search, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

export default function AddPaymentPage() {
  const [customer, setCustomer] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomers, setShowCustomers] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomerIndex, setSelectedCustomerIndex] =
    useState(-1);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);

        const response = await fetch("/api/customers");
        const data = await response.json();

        if (response.ok && data.success) {
          setCustomers(data.customers);
        } else {
          toast.error(data.message || "Failed to fetch customers");
        }
      } catch (error) {
        console.error("Fetch customers error:", error);
        toast.error("Failed to fetch customers");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();

  }, []);

  // Filter customers
  const filteredCustomers = customers.filter((item) =>
    item.name.toLowerCase().includes(customer.toLowerCase())
  );

  // Select customer
  const handleSelectCustomer = (selectedCustomer: Customer) => {
    setCustomer(selectedCustomer.name);
    setSelectedCustomerId(selectedCustomer._id);
    setShowCustomers(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: selectedCustomerId,
          type: "credit",
          amount: Number(amount),
          date,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to add payment");
        return;
      }

      toast.success("Payment added successfully!");

      // Reset form
      setCustomer("");
      setSelectedCustomerId("");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Add payment error:", error);
      toast.error("Something went wrong while adding payment");
    } finally {
      setSubmitting(false);
    }

  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-800">
            Add Payment
          </h1>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Search Customer */}
            <div>
              <label
                htmlFor="customer"
                className="mb-1.5 block text-base font-medium text-gray-800"
              >
                Search Customer
              </label>

              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="customer"
                  type="text"
                  value={customer}
                  onFocus={() => {
                    setShowCustomers(true);
                    setSelectedCustomerIndex(-1);
                  }}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setSelectedCustomerId("");
                    setShowCustomers(true);
                    setSelectedCustomerIndex(-1);
                  }}
                  onKeyDown={(e) => {
                    if (!showCustomers) {
                      if (
                        e.key === "ArrowDown" &&
                        filteredCustomers.length > 0
                      ) {
                        e.preventDefault();
                        setShowCustomers(true);
                        setSelectedCustomerIndex(0);
                      }

                      return;
                    }

                    if (e.key === "ArrowDown") {
                      e.preventDefault();

                      if (filteredCustomers.length > 0) {
                        setSelectedCustomerIndex((prev) =>
                          prev < filteredCustomers.length - 1
                            ? prev + 1
                            : 0
                        );
                      }
                    }

                    if (e.key === "ArrowUp") {
                      e.preventDefault();

                      if (filteredCustomers.length > 0) {
                        setSelectedCustomerIndex((prev) =>
                          prev > 0
                            ? prev - 1
                            : filteredCustomers.length - 1
                        );
                      }
                    }

                    if (e.key === "Enter") {
                      if (
                        selectedCustomerIndex >= 0 &&
                        filteredCustomers[selectedCustomerIndex]
                      ) {
                        e.preventDefault();

                        handleSelectCustomer(
                          filteredCustomers[selectedCustomerIndex]
                        );
                      }
                    }

                    if (e.key === "Escape") {
                      setShowCustomers(false);
                      setSelectedCustomerIndex(-1);
                    }
                  }}
                  placeholder={
                    loadingCustomers
                      ? "Loading customers..."
                      : "Start typing customer name"
                  }
                  disabled={loadingCustomers}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-11 text-base text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                {showCustomers && !loadingCustomers && customer && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((item, index) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => handleSelectCustomer(item)}
                          className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition ${selectedCustomerIndex === index
                              ? "bg-blue-600 text-white"
                              : "text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                          <p className="font-medium">
                            {item.name}
                          </p>

                          <div
                            className={`mt-1 flex justify-between text-xs ${selectedCustomerIndex === index
                                ? "text-blue-100"
                                : "text-gray-500"
                              }`}
                          >
                            <span>{item.phone}</span>

                            <span>
                              Balance: ₹{item.balance}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-500">
                        No customer found
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-lg font-medium text-gray-800"
              >
                Amount
              </label>

              <div className="relative">
                <IndianRupee
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="Enter amount"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-11 text-base text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-lg font-medium text-gray-800"
              >
                Description
              </label>

              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Cash payment"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-lg font-medium text-gray-800"
              >
                Date
              </label>

              <div className="relative">
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-base text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <Calendar
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add Payment"}
            </button>
          </form>
        </div>
      </div>
    </main>

  );
}