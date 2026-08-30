"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePdf } from "@/app/utils/pdf/invoicePdf";

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

export default function EditBillPage() {
  const params = useParams();
  const router = useRouter();

  const billId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billDate, setBillDate] = useState(getToday());

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [showCustomers, setShowCustomers] = useState(false);

  const [items, setItems] = useState<BillItem[]>([
    {
      id: Date.now(),
      model: "",
      qty: "",
      rate: "",
      discount: "",
    },
  ]);
  const [activeCustomerIndex, setActiveCustomerIndex] = useState(-1);
  const [deleting, setDeleting] = useState(false);
  const [dueDate, setDueDate] = useState("");

  // Fetch bill and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [billResponse, customersResponse] =
          await Promise.all([
            fetch(`/api/bills/${billId}`),
            fetch("/api/customers"),
          ]);

        const billData = await billResponse.json();
        const customersData = await customersResponse.json();

        if (
          !billResponse.ok ||
          !billData.success
        ) {
          toast.error(
            billData.message || "Failed to fetch bill"
          );
          router.push("/customers");
          return;
        }

        if (
          customersResponse.ok &&
          customersData.success
        ) {
          setCustomers(customersData.customers || []);
        }

        const bill = billData.bill;

        setInvoiceNumber(String(bill.invoiceNumber));

        if (bill.date) {
          setBillDate(
            new Date(bill.date)
              .toISOString()
              .split("T")[0]
          );
        }

        // Customer
        const customerId =
          typeof bill.customer === "string"
            ? bill.customer
            : bill.customer?._id;

        const customerName =
          typeof bill.customer === "object"
            ? bill.customer?.name
            : "";

        setSelectedCustomerId(customerId || "");
        setCustomerSearch(customerName);

        // Items
        setItems(
          bill.items.map(
            (item: {
              modelNumber: string;
              quantity: number;
              rate: number;
              discount?: number;
            }) => ({
              id:
                Date.now() +
                Math.random(),
              model: item.modelNumber,
              qty: item.quantity,
              rate: item.rate,
              discount:
                item.discount || "",
            })
          )
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load bill");
      } finally {
        setLoading(false);
      }
    };

    if (billId) {
      fetchData();
    }
  }, [billId, router]);

  const calculateItemTotal = (
    item: BillItem
  ) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const discount =
      Number(item.discount) || 0;

    const subtotal = qty * rate;

    const discountAmount =
      (subtotal * discount) / 100;

    return subtotal - discountAmount;
  };

  const grandTotal = items.reduce(
    (total, item) =>
      total + calculateItemTotal(item),
    0
  );

  const totalQuantity = items.reduce(
    (total, item) =>
      total + (Number(item.qty) || 0),
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
          [field]:
            value === ""
              ? ""
              : Number(value),
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
      toast.error(
        "At least one item is required"
      );
      return;
    }

    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.id !== id
      )
    );
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(
          customerSearch.toLowerCase()
        )
  );

  const handleSelectCustomer = (
    customer: Customer
  ) => {
    setSelectedCustomerId(customer._id);
    setCustomerSearch(customer.name);
    setShowCustomers(false);
  };

  const handleUpdateBill = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error(
        "Please select a customer"
      );
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
      toast.error(
        "Please fill all item details correctly"
      );
      return;
    }

    try {
      setUpdating(true);

      const billItems = items.map(
        (item) => ({
          modelNumber: item.model.trim(),
          quantity: Number(item.qty),
          rate: Number(item.rate),
          discount:
            Number(item.discount) || 0,
          totalAmount:
            calculateItemTotal(item),
        })
      );

      const response = await fetch(
        `/api/bills/${billId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            invoiceNumber:
              Number(invoiceNumber),
            customer:
              selectedCustomerId,
            date: billDate,
            items: billItems,
            totalQty: totalQuantity,
            grandTotal,
            dueDate: dueDate || null,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        toast.error(
          data.message ||
          "Failed to update bill"
        );
        return;
      }

      toast.success(
        "Bill updated successfully!"
      );

      router.push("/customers");
    } catch (error) {
      console.error(error);
      toast.error(
        "Something went wrong while updating the bill"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoiceNumber.trim()) {
      toast.error("Please enter invoice number");
      return;
    }

    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    const selectedCustomer = customers.find(
      (customer) => customer._id === selectedCustomerId
    );

    if (!selectedCustomer) {
      toast.error("Selected customer not found");
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
      toast.error("Please fill all item details correctly");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Grand total must be greater than zero");
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

  const handleDeleteBill = async () => {
    if (!billId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this bill?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(`/api/bills/${billId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to delete bill");
        return;
      }

      toast.success("Bill deleted successfully!");

      router.push("/sales");
    } catch (error) {
      console.error("Delete bill error:", error);
      toast.error("Something went wrong while deleting the bill");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

          <h1 className="text-xl font-bold text-gray-800">
            Edit Bill
          </h1>

          <form
            onSubmit={handleUpdateBill}
            className="mt-5 space-y-5"
          >
            {/* Invoice and Date */}
            <div className="grid gap-4 sm:grid-cols-3">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Invoice Number
                </label>

                <input
                  type="number"
                  value={invoiceNumber}
                  onWheel={(e) => {
                    e.currentTarget.blur();
                  }}

                  onChange={(e) =>
                    setInvoiceNumber(
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Bill Date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) =>
                      setBillDate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />

                  <Calendar
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Customer
              </label>
              <input
                type="text"
                value={customerSearch}
                onFocus={() => {
                  setShowCustomers(true);
                }}
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
                      setActiveCustomerIndex(-1);
                    }
                  }

                  if (e.key === "Escape") {
                    setShowCustomers(false);
                    setActiveCustomerIndex(-1);
                  }
                }}
                placeholder="Search customer"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />

              {showCustomers && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {filteredCustomers.map(
                    (customer, index) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => {
                          handleSelectCustomer(customer);
                          setActiveCustomerIndex(-1);
                        }}
                        className={`cursor-pointer block w-full px-3 py-2 text-left text-sm ${activeCustomerIndex === index
                          ? "bg-blue-100 text-blue-900"
                          : "hover:bg-gray-100"
                          }`}
                      >
                        {customer.name}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Items
                </h2>

                <button
                  type="button"
                  onClick={addItem}
                  className="cursor-pointer flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-md border border-gray-200 p-3 sm:grid-cols-12"
                    >
                      {/* Model */}
                      <div className="sm:col-span-4">
                        <label className="mb-1 block text-xs text-gray-500">
                          Model Number
                        </label>

                        <textarea
                          value={item.model}
                          onChange={(e) =>
                            updateItem(item.id, "model", e.target.value)
                          }
                          rows={3}
                          className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-gray-500">
                          Qty
                        </label>

                        <input
                          type="number"
                          value={item.qty}
                          onWheel={(e) => {
                            e.currentTarget.blur();
                          }}

                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "qty",
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm outline-none"
                        />
                      </div>

                      {/* Rate */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-gray-500">
                          Rate
                        </label>

                        <input
                          type="number"
                          value={item.rate}
                          onWheel={(e) => {
                            e.currentTarget.blur();
                          }}

                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "rate",
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm outline-none"
                        />
                      </div>

                      {/* Discount */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-gray-500">
                          Discount %
                        </label>

                        <input
                          type="number"
                          value={item.discount}
                          onWheel={(e) => {
                            e.currentTarget.blur();
                          }}

                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "discount",
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm outline-none"
                        />
                      </div>

                      {/* Delete */}
                      <div className="flex items-end sm:col-span-2">
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          className="cursor-pointer flex h-9 w-full items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="sm:col-span-12">
                        <p className="text-right text-sm font-medium text-gray-700">
                          Total: ₹
                          {calculateItemTotal(
                            item
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 rounded-md bg-gray-50 p-3 text-sm">

                <div className="flex justify-between">
                  <span>Total Quantity</span>
                  <span className="font-semibold">
                    {totalQuantity}
                  </span>
                </div>

                <div className="flex justify-between text-base">
                  <span className="font-semibold">
                    Grand Total
                  </span>

                  <span className="font-bold text-blue-600">
                    ₹
                    {grandTotal.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Update */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={updating || deleting}
                className="cursor-pointer rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
              >
                {updating ? "Updating..." : "Update Bill"}
              </button>

              <button
                type="button"
                onClick={handleDeleteBill}
                disabled={deleting || updating}
                className="cursor-pointer rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white"
              >
                {deleting ? "Deleting..." : "Delete Bill"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={updating || deleting}
                className="cursor-pointer rounded-md border border-gray-300 px-5 py-2.5 text-sm"
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