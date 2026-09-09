"use client";

import { useState } from "react";
import {
  Home,
  UserPlus,
  CreditCard,
  ReceiptText,
  FilePlus2,
  TrendingUp,
  Menu,
  X,
  User,
  LogOut,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

const menuItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Add Customer", icon: UserPlus, href: "/add-customer" },
  { name: "Customers", icon: User, href: "/customers" },
  { name: "Add Payment", icon: CreditCard, href: "/add-payment" },
  { name: "Expenses", icon: ReceiptText, href: "/expenses" },
  { name: "Create Bill", icon: FilePlus2, href: "/create-bill" },
  { name: "Sales", icon: TrendingUp, href: "/sales" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Logout failed");
        return;
      }

      toast.success("Logged out successfully");

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div className="flex flex-1 items-center">
          <a
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-gray-800"
          >

            <span className="sm:block">
              Billing System
            </span>
          </a>
        </div>

        {/* Desktop Navigation - Center */}
        <div className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </a>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Right Side */}
        <div className="flex flex-1 justify-end">

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon size={19} />
                  {item.name}
                </a>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-gray-600 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} />
            </button>

          </div>
        </div>
      )}
    </header>
  );
}