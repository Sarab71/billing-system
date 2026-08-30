"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, X, Download } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePdf } from "../utils/pdf/invoicePdf";

interface BillItem {
  id: number;
  model: string;
  qty: number | "";
  rate: number | "";
  discount: number | "";
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

export default function CreateBillPage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billDate, setBillDate] = useState(getToday());

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showCustomers, setShowCustomers] = useState(false);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [creatingBill, setCreatingBill] = useState(false);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);
  const [dueDate, setDueDate] = useState("");

  const [createdBill, setCreatedBill] = useState<{
    invoiceNumber: number;
    date: string;
    customer: {
      name: string;
      phone: string;
      address: string;
    };
    items: {
      modelNumber: string;
      quantity: number;
      rate: number;
      discount?: number;
      totalAmount: number;
    }[];
    totalQty: number;
    grandTotal: number;
  } | null>(null);

  const [items, setItems] = useState<BillItem[]>([
    {
      id: Date.now(),
      model: "",
      qty: "",
      rate: "",
      discount: "",
    },
  ]);

  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await fetch("/api/bills/next-invoice");
      const data = await response.json();

      if (response.ok && data.success) {
        setInvoiceNumber(String(data.nextInvoiceNumber));
      } else {
        toast.error(
          data.message || "Failed to get next invoice number"
        );
      }
    } catch (error) {
      console.error("Failed to fetch invoice number:", error);
      toast.error("Failed to get next invoice number");
    }
  };

  useEffect(() => {
    fetchNextInvoiceNumber();
  }, []);

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

  const calculateItemTotal = (item: BillItem) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount) || 0;

    const subtotal = qty * rate;
    const discountAmount = (subtotal * discount) / 100;

    return subtotal - discountAmount;

  };

  const grandTotal = items.reduce(
    (total, item) => total + calculateItemTotal(item),
    0
  );

  const totalQuantity = items.reduce(
    (total, item) => total + (Number(item.qty) || 0),
    0
  );

  const updateItem = (
    id: number,
    field: keyof Omit<BillItem, "id">,
    value: string
  ) => {
    setItems((previousItems) =>
      previousItems.map((item) => {
        if (item.id !== id) return item;

        if (field === "model") {
          return {
            ...item,
            model: value,
          };
        }

        return {
          ...item,
          [field]: value === "" ? "" : Number(value),
        };
      })
    );

  };

  const addItem = () => {
    setItems((previousItems) => [
      ...previousItems,
      {
        id: Date.now(),
        model: "",
        qty: "",
        rate: "",
        discount: "",
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) {
      setItems([
        {
          id: Date.now(),
          model: "",
          qty: "",
          rate: "",
          discount: "",
        },
      ]);
      return;
    }

    setItems((previousItems) =>
      previousItems.filter((item) => item.id !== id)
    );

  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Select customer
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer._id);
    setCustomerSearch(customer.name);
    setShowCustomers(false);
  };

  // Create bill
  const handleCreateBill = async () => {
    if (!invoiceNumber.trim()) {
      toast.error("Please enter invoice number.");
      return;
    }

    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.model.trim() ||
        !item.qty ||
        Number(item.qty) <= 0 ||
        item.rate === "" ||
        Number(item.rate) < 0
    );

    if (invalidItem) {
      toast.error("Please fill all item details correctly.");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Grand total must be greater than zero.");
      return;
    }

    try {
      setCreatingBill(true);

      const billItems = items.map((item) => ({
        modelNumber: item.model.trim(),
        quantity: Number(item.qty),
        rate: Number(item.rate),
        discount: Number(item.discount) || 0,
        totalAmount: calculateItemTotal(item),
      }));

      const selectedCustomer = customers.find(
        (customer) => customer._id === selectedCustomerId
      );

      if (!selectedCustomer) {
        toast.error("Selected customer not found.");
        return;
      }

      const response = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceNumber: Number(invoiceNumber),
          customer: selectedCustomerId,
          date: billDate,
          items: billItems,
          totalQty: totalQuantity,
          grandTotal: grandTotal,
          dueDate: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to create bill");
        return;
      }

      toast.success("Bill created successfully!");

      setCreatedBill({
        invoiceNumber: data.bill.invoiceNumber,
        date: data.bill.date,

        customer: {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          address: selectedCustomer.address,
        },

        items: data.bill.items,
        totalQty: data.bill.totalQty,
        grandTotal: data.bill.grandTotal,
      });

      // Reset form
      setSelectedCustomerId("");
      setCustomerSearch("");

      setItems([
        {
          id: Date.now(),
          model: "",
          qty: "",
          rate: "",
          discount: "",
        },
      ]);

      await fetchNextInvoiceNumber();

    } catch (error) {
      console.error("Create bill error:", error);
      toast.error("Something went wrong while creating the bill.");
    } finally {
      setCreatingBill(false);
    }

  };

  const handleExportPDF = async () => {
    // Validation
    if (!invoiceNumber.trim()) {
      toast.error("Please enter invoice number.");
      return;
    }

    if (!selectedCustomerId) {
      toast.error("Please select a customer.");
      return;
    }

    const selectedCustomer = customers.find(
      (customer) => customer._id === selectedCustomerId
    );

    if (!selectedCustomer) {
      toast.error("Selected customer not found.");
      return;
    }

    const invalidItem = items.some(
      (item) =>
        !item.model.trim() ||
        !item.qty ||
        Number(item.qty) <= 0 ||
        item.rate === "" ||
        Number(item.rate) < 0
    );

    if (invalidItem) {
      toast.error("Please fill all item details correctly.");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Grand total must be greater than zero.");
      return;
    }

    try {
      await generateInvoicePdf({
        invoiceNumber,
        billDate,
        customer: selectedCustomer,
        items,
        totalQuantity,
        grandTotal,
      });

      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate invoice PDF");
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Create Bill
          </h1>

          {/* Invoice Number + Bill Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="invoiceNumber"
                className="mb-1.5 block text-sm font-medium text-gray-800"
              >
                Invoice Number
              </label>

              <input
                id="invoiceNumber"
                type="number"
                value={invoiceNumber}
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="billDate"
                className="mb-1.5 block text-sm font-medium text-gray-800"
              >
                Bill Date
              </label>

              <div className="relative">
                <input
                  id="billDate"
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="cursor-pointer w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <Calendar
                  size={17}
                  className="cursor-pointer pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Due Date
              </label>

              <div className="relative">
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  min={billDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="cursor-pointer w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <Calendar
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="relative mt-4">
            <label
              htmlFor="customer"
              className="mb-1.5 block text-sm font-medium text-gray-800"
            >
              Search Customer
            </label>

            <input
              id="customer"
              type="text"
              value={customerSearch}
              onFocus={() => setShowCustomers(true)}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomerId("");
                setShowCustomers(true);
                setActiveCustomerIndex(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();

                  if (filteredCustomers.length > 0) {
                    setActiveCustomerIndex((previous) =>
                      previous < filteredCustomers.length - 1
                        ? previous + 1
                        : 0
                    );
                  }
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();

                  if (filteredCustomers.length > 0) {
                    setActiveCustomerIndex((previous) =>
                      previous > 0
                        ? previous - 1
                        : filteredCustomers.length - 1
                    );
                  }
                }

                if (e.key === "Enter") {
                  e.preventDefault();

                  if (
                    activeCustomerIndex >= 0 &&
                    filteredCustomers[activeCustomerIndex]
                  ) {
                    handleSelectCustomer(
                      filteredCustomers[activeCustomerIndex]
                    );
                  }
                }

                if (e.key === "Escape") {
                  setShowCustomers(false);
                  setActiveCustomerIndex(-1);
                }
              }}
              placeholder={
                loadingCustomers
                  ? "Loading customers..."
                  : "Type customer name"
              }
              disabled={loadingCustomers}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {showCustomers && !loadingCustomers && customerSearch && (
              <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <button
                      key={customer._id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className={`block w-full border-b border-gray-100 px-4 py-2 text-left text-sm ${activeCustomerIndex === index
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                        }`}
                    >
                      <p className="font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {customer.phone}
                      </p>
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

          {/* Items Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-175 border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                    Model
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                    Qty
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                    Rate
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                    Disc%
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                    Total
                  </th>

                  <th className="border border-gray-300 px-2 py-2 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-1.5">
                      <textarea
                        value={item.model}
                        onChange={(e) =>
                          updateItem(item.id, "model", e.target.value)
                        }
                        rows={3}
                        className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="number"
                        min="0"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(item.id, "qty", e.target.value)
                        }
                        onWheel={(e) => {
                          e.currentTarget.blur();
                        }}

                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(item.id, "rate", e.target.value)
                        }
                        onWheel={(e) => {
                          e.currentTarget.blur();
                        }}

                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="border border-gray-300 p-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(item.id, "discount", e.target.value)
                        }
                        onWheel={(e) => {
                          e.currentTarget.blur();
                        }}

                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">
                      ₹{calculateItemTotal(item).toFixed(2)}
                    </td>

                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="cursor-pointer rounded p-1.5 text-red-500 transition hover:bg-red-50"
                        aria-label="Remove item"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="cursor-pointer mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Add Item
          </button>

          {/* Totals */}
          <div className="mt-7 flex justify-end">
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                Grand Total: ₹{grandTotal.toFixed(2)}
              </p>

              <p className="mt-2 text-base font-medium text-gray-800">
                Total Quantity: {totalQuantity}
              </p>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCreateBill}
                  disabled={creatingBill}
                  className="cursor-pointer rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingBill ? "Creating..." : "Create Bill"}
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Download size={17} />
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

  );
}