"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function AddCustomerPage() {
const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [address, setAddress] = useState("");
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (
e: React.FormEvent<HTMLFormElement>
) => {
e.preventDefault();

if (!name.trim() || !phone.trim() || !address.trim()) {
  toast.error("Please fill all fields");
  return;
}

try {
  setSubmitting(true);

  const response = await fetch("/api/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      balance: 0,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    toast.error(data.message || "Failed to add customer");
    return;
  }

  toast.success("Customer added successfully!");

  // Reset form
  setName("");
  setPhone("");
  setAddress("");
} catch (error) {
  console.error("Add customer error:", error);
  toast.error("Something went wrong while adding customer");
} finally {
  setSubmitting(false);
}

};

return (
<main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-10 sm:px-6">
<div className="mx-auto w-full max-w-xl">
<div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
<h1 className="text-2xl font-bold text-gray-800">
Add Customer
</h1>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-base font-medium text-gray-800"
          >
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter customer name"
            required
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-base font-medium text-gray-800"
          >
            Phone
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            required
            disabled={submitting}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="mb-1.5 block text-base font-medium text-gray-800"
          >
            Address
          </label>

          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
            rows={4}
            required
            disabled={submitting}
            className="w-full resize-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-md bg-blue-600 px-6 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add Customer"}
        </button>
      </form>
    </div>
  </div>
</main>

);
}