"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Please enter username");
      return;
    }

    if (!password) {
      toast.error("Please enter password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Invalid username or password"
        );
        return;
      }

      toast.success("Login successful");

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <LockKeyhole
              size={22}
              className="text-blue-600"
            />
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Billing System
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="mt-6 space-y-4"
        >
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <div className="relative">
              <User
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                autoComplete="username"
                disabled={loading}
                placeholder="Enter username"
                className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
                placeholder="Enter password"
                className="w-full rounded-md border border-gray-300 py-2.5 pr-3 pl-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                size={17}
                className="animate-spin"
              />
            )}

            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}