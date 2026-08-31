"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface Transaction {
  _id: string;
  customer:
  | string
  | {
    _id: string;
    name: string;
  };
  type: "debit" | "credit";
  amount: number;
  date: string;
  description?: string;
}

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();

  const transactionId = params.id as string;

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [showCustomers, setShowCustomers] =
    useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);

  // Fetch payment + customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [
          transactionResponse,
          customersResponse,
        ] = await Promise.all([
          fetch(
            `/api/transactions/${transactionId}`
          ),
          fetch("/api/customers"),
        ]);

        const transactionData =
          await transactionResponse.json();

        const customersData =
          await customersResponse.json();

        if (
          !transactionResponse.ok ||
          !transactionData.success
        ) {
          toast.error(
            transactionData.message ||
            "Failed to load payment"
          );

          router.push("/customers");
          return;
        }

        if (
          customersResponse.ok &&
          customersData.success
        ) {
          setCustomers(
            customersData.customers || []
          );
        }

        const transaction: Transaction =
          transactionData.transaction;

        // Customer
        const customerId =
          typeof transaction.customer === "string"
            ? transaction.customer
            : transaction.customer?._id;

        const customerName =
          typeof transaction.customer === "string"
            ? customersData.customers?.find(
              (customer: Customer) =>
                customer._id ===
                transaction.customer
            )?.name || ""
            : transaction.customer?.name || "";

        setSelectedCustomerId(customerId || "");
        setCustomerSearch(customerName);

        // Payment details
        setAmount(String(transaction.amount || ""));

        setDescription(
          transaction.description || ""
        );

        if (transaction.date) {
          setDate(
            new Date(transaction.date)
              .toISOString()
              .split("T")[0]
          );
        }
      } catch (error) {
        console.error(
          "Fetch payment error:",
          error
        );

        toast.error("Failed to load payment");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      fetchData();
    }
  }, [transactionId, router]);

  // Customer search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(
          customerSearch.toLowerCase()
        )
  );

  // Select customer
  const handleSelectCustomer = (
    customer: Customer
  ) => {
    setSelectedCustomerId(customer._id);
    setCustomerSearch(customer.name);
    setShowCustomers(false);
  };

  // Update payment
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    if (
      !amount ||
      Number(amount) <= 0
    ) {
      toast.error(
        "Please enter a valid amount"
      );
      return;
    }

    if (!date) {
      toast.error("Please select a date");
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/transactions/${transactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customer: selectedCustomerId,
            type: "credit",
            amount: Number(amount),
            description: description.trim(),
            date,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
          "Failed to update payment"
        );

        return;
      }

      toast.success(
        "Payment updated successfully!"
      );

      router.push("/customers");
    } catch (error) {
      console.error(
        "Update payment error:",
        error
      );

      toast.error(
        "Something went wrong while updating payment"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!transactionId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/transactions/${transactionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to delete payment"
        );
        return;
      }

      toast.success("Payment deleted successfully!");

      router.push("/customers");
    } catch (error) {
      console.error("Delete payment error:", error);

      toast.error(
        "Something went wrong while deleting payment"
      );
    } finally {
      setDeleting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50">
        <Loader2
          size={30}
          className="animate-spin text-blue-600"
        />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-xl">

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">

          <h1 className="text-2xl font-bold text-gray-800">
            Edit Payment
          </h1>

          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
          >

            {/* Customer */}
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Customer
              </label>

              <input
                type="text"
                value={customerSearch}
                onFocus={() => {
                  setShowCustomers(true);
                  setSelectedCustomerIndex(-1);
                }}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomerId("");
                  setShowCustomers(true);
                  setSelectedCustomerIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (!showCustomers) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setShowCustomers(true);
                      setSelectedCustomerIndex(0);
                    }
                    return;
                  }

                  if (e.key === "ArrowDown") {
                    e.preventDefault();

                    setSelectedCustomerIndex((prev) =>
                      prev < filteredCustomers.length - 1
                        ? prev + 1
                        : 0
                    );
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();

                    setSelectedCustomerIndex((prev) =>
                      prev > 0
                        ? prev - 1
                        : filteredCustomers.length - 1
                    );
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();

                    if (
                      selectedCustomerIndex >= 0 &&
                      filteredCustomers[selectedCustomerIndex]
                    ) {
                      handleSelectCustomer(
                        filteredCustomers[selectedCustomerIndex]
                      );

                      setSelectedCustomerIndex(-1);
                    }
                  }

                  if (e.key === "Escape") {
                    setShowCustomers(false);
                    setSelectedCustomerIndex(-1);
                  }
                }}
                placeholder="Search customer"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {showCustomers && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">
                      No customer found
                    </p>
                  ) : (
                    filteredCustomers.map(
                      (customer, index) => (
                        <button
                          key={customer._id}
                          type="button"
                          onClick={() => {
                            handleSelectCustomer(customer);
                            setSelectedCustomerIndex(-1);
                          }}
                          className={`block w-full px-3 py-2 text-left text-sm transition ${selectedCustomerIndex === index
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          {customer.name}
                        </button>
                      )
                    )
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Amount
              </label>

              <input
                type="number"
                value={amount}
                onWheel={(e) => {
                  e.currentTarget.blur();
                }}

                onChange={(e) =>
                  setAmount(e.target.value)
                }
                min="1"
                placeholder="Enter amount"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="e.g. Cash payment"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Date */}
            <div>
              <label className="cursor-pointer mb-1.5 block text-sm font-medium text-gray-700">
                Date
              </label>

              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  required
                  className="cursor-pointer w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <Calendar
                  size={17}
                  className="cursor-pointer pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={updating || deleting}
                className="cursor-pointer rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {updating ? "Updating..." : "Update Payment"}
              </button>

              <button
                type="button"
                onClick={handleDeletePayment}
                disabled={deleting || updating}
                className="cursor-pointer rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Payment"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={deleting || updating}
                className="cursor-pointer rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}