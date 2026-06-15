// frontend/app/sys-portal/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Lock, ArrowRight } from "lucide-react";

export default function HiddenAdminLogin() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Hardcode role: 'admin' agar backend memvalidasi tabel users dengan benar
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role: "admin" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Access Denied");
      }

      // Jika role yang dikembalikan bukan admin, tolak
      if (data.user.role !== "admin") {
        throw new Error("Unauthorized access level.");
      }

      // Login sukses, redirect ke dashboard atau homepage
      // Anda bisa set redirectPath ke '/admin-dashboard' jika nanti dibuat
      login(data.user, "/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      {/* Background Effect untuk kesan "Rahasia" */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />

      <div className="relative w-full max-w-sm p-8 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-red-900/20 border border-red-900/50">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-center mb-1 tracking-wider uppercase text-slate-300">
          System Access
        </h1>
        <p className="text-xs text-center text-slate-600 mb-8 font-mono">
          Authorized Personnel Only
        </p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-900/50 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Admin ID"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passphrase"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group bg-slate-100 hover:bg-white text-black font-bold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Authenticating..." : "Enter Console"}
            {!loading && (
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
