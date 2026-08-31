"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  IndianRupee,
  Plus,
  Tag,
  FileText,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ExpenseCategory {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: {
    _id: string;
    name: string;
  } | string;
}

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

export default function ExpensesPage() {
  // Categories
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Expense form
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getToday());
  const [categoryId, setCategoryId] = useState("");
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(getToday());
  // Edit Category
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Edit Expense
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState({
    description: "",
    amount: "",
    date: "",
    categoryId: "",
  });

  const handleStartEditCategory = (category: ExpenseCategory) => {
    setEditingCategoryId(category._id);
    setEditingCategoryName(category.name);
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      const response = await fetch(
        `/api/expense-categories/${categoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingCategoryName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update category");
        return;
      }

      toast.success("Category updated successfully");

      setEditingCategoryId(null);
      setEditingCategoryName("");

      await fetchCategories();
      await fetchExpenses();
    } catch (error) {
      console.error("Update category error:", error);
      toast.error("Failed to update category");
    }
  };

  const handleStartEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense._id);

    const currentCategoryId =
      typeof expense.categoryId === "object" && expense.categoryId
        ? expense.categoryId._id
        : typeof expense.categoryId === "string"
          ? expense.categoryId
          : "";

    setEditingExpense({
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date
        ? new Date(expense.date).toISOString().split("T")[0]
        : "",
      categoryId: currentCategoryId,
    });
  };

  const handleUpdateExpense = async (expenseId: string) => {
    if (!editingExpense.description.trim()) {
      toast.error("Please enter description");
      return;
    }

    if (!editingExpense.categoryId) {
      toast.error("Please select category");
      return;
    }

    const expenseAmount = Number(editingExpense.amount);

    if (!expenseAmount || expenseAmount <= 0) {
      toast.error("Please enter valid amount");
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: editingExpense.description.trim(),
          amount: expenseAmount,
          date: editingExpense.date,
          categoryId: editingExpense.categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to update expense");
        return;
      }

      toast.success("Expense updated successfully");

      setEditingExpenseId(null);

      await fetchExpenses();
    } catch (error) {
      console.error("Update expense error:", error);
      toast.error("Failed to update expense");
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const response = await fetch("/api/expense-categories");
      const data = await response.json();

      if (response.ok && data.success) {
        setCategories(data.categories);
      } else {
        toast.error(
          data.message || "Failed to fetch expense categories"
        );
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      toast.error("Failed to fetch expense categories");
    } finally {
      setLoadingCategories(false);
    }

  };

  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);

      const params = new URLSearchParams();

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      const url =
        params.toString()
          ? `/api/expenses?${params.toString()}`
          : "/api/expenses";

      const response = await fetch(url);

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to fetch expenses"
        );
        return;
      }

      setExpenses(data.expenses || []);
    } catch (error) {
      console.error("Fetch expenses error:", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(categorySearch.toLowerCase().trim())
  );

  // Create category
  const handleCreateCategory = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setCreatingCategory(true);

      const response = await fetch("/api/expense-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to create category"
        );
        return;
      }

      toast.success("Expense category added successfully!");

      setCategoryName("");

      await fetchCategories();

      // Automatically select newly created category
      if (data.category?._id) {
        setCategoryId(data.category._id);
      }
    } catch (error) {
      console.error("Create category error:", error);
      toast.error("Something went wrong while creating category");
    } finally {
      setCreatingCategory(false);
    }

  };

  // Create expense
  const handleCreateExpense = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!categoryId) {
      toast.error("Please select an expense category");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter expense description");
      return;
    }

    const expenseAmount = Number(amount);

    if (!expenseAmount || expenseAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!date) {
      toast.error("Please select a date");
      return;
    }

    try {
      setCreatingExpense(true);

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: expenseAmount,
          date,
          categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to create expense"
        );
        return;
      }

      toast.success("Expense added successfully!");
      await fetchExpenses();

      // Reset expense form
      setDescription("");
      setAmount("");
      setDate(getToday());

    } catch (error) {
      console.error("Create expense error:", error);
      toast.error("Something went wrong while adding expense");
    } finally {
      setCreatingExpense(false);
    }

  };

  const handleDeleteCategory = async (
    categoryId: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/expense-categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to delete category"
        );
        return;
      }

      toast.success(
        "Expense category deleted successfully"
      );

      await fetchCategories();
    } catch (error) {
      console.error("Delete category error:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteExpense = async (
    expenseId: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to delete expense"
        );
        return;
      }

      toast.success("Expense deleted successfully");

      await fetchExpenses();
    } catch (error) {
      console.error("Delete expense error:", error);
      toast.error("Failed to delete expense");
    }
  };

  const groupedExpenses = expenses.reduce(
    (groups, expense) => {
      const categoryName =
        typeof expense.categoryId === "object" &&
          expense.categoryId
          ? expense.categoryId.name
          : "Uncategorized";

      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }

      groups[categoryName].push(expense);

      return groups;
    },
    {} as Record<string, Expense[]>
  );

  return (

    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Expenses
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Create expense categories and manage your business expenses
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Add Category */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Tag size={20} className="text-blue-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Add Expense Category
                </h2>

                <p className="text-xs text-gray-500">
                  Create a category before adding expenses
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateCategory}
              className="mt-6"
            >
              <label
                htmlFor="categoryName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category Name
              </label>

              <input
                id="categoryName"
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Transportation"
                disabled={creatingCategory}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={creatingCategory}
                className="cursor-pointer mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={17} />

                {creatingCategory
                  ? "Adding..."
                  : "Add Category"}
              </button>
            </form>

            {/* Existing categories */}
            {!loadingCategories && categories.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Existing Categories
                </p>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      {editingCategoryId === category._id ? (
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) =>
                            setEditingCategoryName(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateCategory(category._id);
                            }

                            if (e.key === "Escape") {
                              setEditingCategoryId(null);
                            }
                          }}
                          autoFocus
                          className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm outline-none"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-700">
                          {category.name}
                        </span>
                      )}

                      <div className="ml-3 flex items-center gap-2">
                        {editingCategoryId === category._id ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateCategory(category._id)
                              }
                              className="cursor-pointer rounded p-1.5 text-green-600 hover:bg-green-50"
                              title="Save"
                            >
                              <Check size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditingCategoryName("");
                              }}
                              className="cursor-pointer rounded p-1.5 text-gray-500 hover:bg-gray-200"
                              title="Cancel"
                            >
                              <X size={17} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleStartEditCategory(category)
                              }
                              className="cursor-pointer rounded p-1.5 text-blue-600 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCategory(category._id)
                              }
                              className="cursor-pointer rounded p-1.5 text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Add Expense */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <IndianRupee
                  size={20}
                  className="text-green-600"
                />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Add Expense
                </h2>

                <p className="text-xs text-gray-500">
                  Record a new business expense
                </p>
              </div>
            </div>

            {loadingCategories ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <Tag
                  size={28}
                  className="mx-auto text-gray-400"
                />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No expense categories yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Please create an expense category first.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleCreateExpense}
                className="mt-6 space-y-4"
              >
                {/* Category */}
                <div className="relative">
                  <label
                    htmlFor="category"
                    className="mb-1.5 block text-sm font-medium text-gray-800"
                  >
                    Expense Category
                  </label>

                  <input
                    id="category"
                    type="text"
                    value={categorySearch}
                    disabled={creatingExpense}
                    placeholder="Search expense category..."
                    onFocus={() => {
                      setShowCategories(true);
                      setSelectedCategoryIndex(-1);
                    }}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setCategoryId("");
                      setShowCategories(true);
                      setSelectedCategoryIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (!showCategories) {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setShowCategories(true);
                          setSelectedCategoryIndex(0);
                        }
                        return;
                      }

                      if (e.key === "ArrowDown") {
                        e.preventDefault();

                        setSelectedCategoryIndex((prev) =>
                          prev < filteredCategories.length - 1
                            ? prev + 1
                            : 0
                        );
                      }

                      if (e.key === "ArrowUp") {
                        e.preventDefault();

                        setSelectedCategoryIndex((prev) =>
                          prev > 0
                            ? prev - 1
                            : filteredCategories.length - 1
                        );
                      }

                      if (e.key === "Enter") {
                        e.preventDefault();

                        if (
                          selectedCategoryIndex >= 0 &&
                          filteredCategories[selectedCategoryIndex]
                        ) {
                          const category =
                            filteredCategories[selectedCategoryIndex];

                          setCategoryId(category._id);
                          setCategorySearch(category.name);
                          setShowCategories(false);
                          setSelectedCategoryIndex(-1);
                        }
                      }

                      if (e.key === "Escape") {
                        setShowCategories(false);
                        setSelectedCategoryIndex(-1);
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                  />

                  {showCategories && !creatingExpense && (
                    <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((category, index) => (
                          <button
                            key={category._id}
                            type="button"
                            onClick={() => {
                              setCategoryId(category._id);
                              setCategorySearch(category.name);
                              setShowCategories(false);
                              setSelectedCategoryIndex(-1);
                            }}
                            className={`block w-full px-4 py-2.5 text-left text-sm transition ${selectedCategoryIndex === index
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-blue-50"
                              }`}
                          >
                            {category.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No category found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>

                  <div className="relative">
                    <FileText
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="description"
                      type="text"
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="Enter expense description"
                      disabled={creatingExpense}
                      className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Amount
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onWheel={(e) => {
                        e.currentTarget.blur();
                      }}

                      placeholder="Enter amount"
                      disabled={creatingExpense}
                      className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="date"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Date
                  </label>

                  <div className="relative">
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={creatingExpense}
                      className="cursor-pointer w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                    />

                    <Calendar
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingExpense}
                  className="cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={17} />

                  {creatingExpense
                    ? "Adding Expense..."
                    : "Add Expense"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>

      {/* All Expenses */}

      <section className="mx-auto mt-6 max-w-5xl">
        {/* Main Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              All Expenses
            </h2>
            {/* DATE FILTERS */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                {/* Start Date */}
                <div className="w-full sm:w-auto">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Start Date
                  </label>

                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full cursor-pointer rounded-md border border-gray-300 py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                    />

                    <Calendar
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="w-full sm:w-auto">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    End Date
                  </label>

                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      max={getToday()}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full cursor-pointer rounded-md border border-gray-300 py-2.5 pr-10 pl-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
                    />

                    <Calendar
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>

                {/* Clear Filter */}
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate(getToday());
                    }}
                    className="cursor-pointer rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Expenses grouped by category
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
            {expenses.length} Expenses
          </span>
        </div>

        {loadingExpenses ? (

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
            Loading expenses...
          </div>

        ) : expenses.length === 0 ? (

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-400">
            No expenses found
          </div>

        ) : (

          <div className="space-y-6">

            {Object.entries(groupedExpenses).map(
              ([categoryName, categoryExpenses]) => {

                const categoryTotal =
                  categoryExpenses.reduce(
                    (total, expense) =>
                      total + (Number(expense.amount) || 0),
                    0
                  );

                return (
                  <div
                    key={categoryName}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >

                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <Tag
                            size={18}
                            className="text-blue-600"
                          />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {categoryName}
                          </h3>

                          <p className="text-xs text-gray-500">
                            {categoryExpenses.length} expense
                            {categoryExpenses.length !== 1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-gray-500">
                          Category Total
                        </p>

                        <p className="font-semibold text-red-600">
                          ₹
                          {categoryTotal.toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>

                    </div>

                    {/* Category Table */}
                    <div className="overflow-x-auto">

                      <table className="w-full text-left text-sm">

                        <thead className="border-b border-gray-100 bg-white text-xs uppercase text-gray-500">

                          <tr>

                            <th className="px-5 py-3">
                              Date
                            </th>

                            <th className="px-5 py-3">
                              Description
                            </th>

                            <th className="px-5 py-3 text-right">
                              Amount
                            </th>

                            <th className="px-5 py-3 text-center">
                              Actions
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {categoryExpenses.map(
                            (expense) => {

                              const isEditing =
                                editingExpenseId ===
                                expense._id;

                              return (
                                <tr
                                  key={expense._id}
                                  className="border-b border-gray-100 last:border-b-0"
                                >

                                  {/* Date */}
                                  <td className="whitespace-nowrap px-5 py-3">

                                    {isEditing ? (

                                      <input
                                        type="date"
                                        value={
                                          editingExpense.date
                                        }
                                        onChange={(e) =>
                                          setEditingExpense({
                                            ...editingExpense,
                                            date:
                                              e.target
                                                .value,
                                          })
                                        }
                                        className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                      />

                                    ) : (

                                      <span className="text-gray-600">
                                        {new Date(
                                          expense.date
                                        ).toLocaleDateString(
                                          "en-IN"
                                        )}
                                      </span>

                                    )}

                                  </td>

                                  {/* Description */}
                                  <td className="max-w-md px-5 py-3">

                                    {isEditing ? (

                                      <input
                                        type="text"
                                        value={
                                          editingExpense.description
                                        }
                                        onChange={(e) =>
                                          setEditingExpense({
                                            ...editingExpense,
                                            description:
                                              e.target.value,
                                          })
                                        }
                                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                      />

                                    ) : (

                                      <span className="text-gray-700">
                                        {expense.description}
                                      </span>

                                    )}

                                  </td>

                                  {/* Amount */}
                                  <td className="whitespace-nowrap px-5 py-3 text-right">

                                    {isEditing ? (

                                      <input
                                        type="number"
                                        min="0"
                                        value={
                                          editingExpense.amount
                                        }
                                        onChange={(e) =>
                                          setEditingExpense({
                                            ...editingExpense,
                                            amount:
                                              e.target.value,
                                          })
                                        }
                                        className="w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm outline-none focus:border-blue-500"
                                      />

                                    ) : (

                                      <span className="font-semibold text-red-600">
                                        ₹
                                        {Number(
                                          expense.amount
                                        ).toLocaleString(
                                          "en-IN"
                                        )}
                                      </span>

                                    )}

                                  </td>

                                  {/* Actions */}
                                  <td className="px-5 py-3">

                                    {isEditing ? (

                                      <div className="flex justify-center gap-2">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleUpdateExpense(
                                              expense._id
                                            )
                                          }
                                          className="rounded-md p-2 text-green-600 transition hover:bg-green-50"
                                          title="Save"
                                        >
                                          <Check size={17} />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingExpenseId(
                                              null
                                            )
                                          }
                                          className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100"
                                          title="Cancel"
                                        >
                                          <X size={17} />
                                        </button>

                                      </div>

                                    ) : (

                                      <div className="flex justify-center gap-2">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleStartEditExpense(
                                              expense
                                            )
                                          }
                                          className="cursor-pointer rounded-md p-2 text-blue-600 transition hover:bg-blue-50"
                                          title="Edit"
                                        >
                                          <Pencil size={17} />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteExpense(
                                              expense._id
                                            )
                                          }
                                          className="cursor-pointer rounded-md p-2 text-red-600 transition hover:bg-red-50"
                                          title="Delete"
                                        >
                                          <Trash2 size={17} />
                                        </button>

                                      </div>

                                    )}

                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>


    </main>

  );
}