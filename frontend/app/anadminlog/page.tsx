// frontend/app/anadminlog/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  // Role is hardcoded to admin for this secure route
  const role = "admin";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as admin, redirect
  useEffect(() => {
    if (user && user.role === "admin") {
      router.push("/admin/dashboard");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        identifier,
        password,
        role, // Always 'admin'
      });

      const userData = res.data.user;

      // SECURITY CHECK: Strictly enforce admin role
      if (userData.role !== "admin") {
        toast.error("Nice try. This portal is for Admins only.");
        setIsLoading(false);
        return;
      }

      login(userData);
      router.push("/admin/dashboard");
      toast.success("Welcome, Administrator.");
    } catch (err: any) {
      let msg = err.response?.data?.error || "Login failed";

      if (
        !err.response?.data?.error &&
        (err.response?.status === 400 || err.response?.status === 401)
      ) {
        msg = "Invalid Credentials.";
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50 flex items-center justify-center relative overflow-hidden">
      {/* Background Elements - Same as Login */}
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-red-600/10 blur-[100px]" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />

      <div className="w-full max-w-md p-8 relative z-10 glass-card rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-orange-600 text-xl font-semibold text-white shadow-lg mx-auto">
              A
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white">Admin Access</h2>
          <p className="text-slate-300 text-sm mt-2">Secure Gateway</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-200 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* No Role Selection UI - Hidden Logic */}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 pl-1">
                Admin ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-600"
                placeholder="Enter Admin ID"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 pl-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 bg-linear-to-r from-red-600 to-red-900 shadow-red-600/25"
          >
            {isLoading ? "Verifying..." : "Authenticate"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Restricted Area. Authorized Personnel Only.
        </p>
      </div>
    </div>
  );
}
