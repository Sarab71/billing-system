"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface EditCustomerFormProps {
  customer: Customer;
  onClose: () => void;
  onUpdated: (customer: Customer) => void;
}

export default function EditCustomerForm({
  customer,
  onClose,
  onUpdated,
}: EditCustomerFormProps) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(customer.address);

  const [updating, setUpdating] = useState(false);

  // Important: selected customer change hone par form update ho
  useEffect(() => {
    setName(customer.name || "");
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
  }, [customer]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter customer name");
      return;
    }

    if (!phone.trim()) {
      alert("Please enter phone number");
      return;
    }

    if (!address.trim()) {
      alert("Please enter customer address");
      return;
    }

    try {
      setUpdating(true);

      const response = await fetch(
        `/api/customers/${customer._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Failed to update customer");
        return;
      }

      onUpdated(data.customer);

      onClose();
    } catch (error) {
      console.error("Update customer error:", error);

      alert("Failed to update customer");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Edit Customer
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update customer information
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={updating}
          className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-5 space-y-4"
      >
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Customer Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter customer name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Address */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Address
          </label>

          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder="Enter customer address"
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Balance */}
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Current Balance
          </p>

          <p className="mt-1 text-lg font-bold text-gray-800">
            ₹
            {Number(customer.balance || 0).toLocaleString(
              "en-IN"
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={updating}
            className="cursor-pointer rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? (
              <span className="flex items-center gap-2">
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Updating...
              </span>
            ) : (
              "Update Customer"
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="cursor-pointer rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}