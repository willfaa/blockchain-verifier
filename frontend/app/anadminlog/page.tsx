// frontend/app/anadminlog/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AlertCircle, ShieldAlert } from "lucide-react";

export default function AdminLoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  // Role is hardcoded to admin for this secure route
  const role = "admin";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "session_expired") {
        setSessionNotice("Sesi administrator Anda telah berakhir. Silakan otentikasi ulang.");
        localStorage.removeItem("chainnesa_user");
      } else if (err === "session_overwritten") {
        setSessionNotice("Akun administrator Anda telah keluar karena sesi baru dimulai di tempat lain.");
        localStorage.removeItem("chainnesa_user");
      }

      // Smoothly clean the error parameter from address bar
      if (err) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

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
        identifier: identifier.trim(),
        password,
        role, // Always 'admin'
      });

      const userData = res.data.user;

      // SECURITY CHECK: Strictly enforce admin role
      if (userData.role !== "admin") {
        toast.error("Akses Ditolak: Portal ini hanya untuk Administrator.");
        setIsLoading(false);
        return;
      }

      login(userData, null);
      router.push("/admin/dashboard");
      toast.success("Autentikasi Berhasil. Selamat datang, Administrator.");
    } catch (err: any) {
      let msg = err.response?.data?.error || "Login gagal, silakan periksa kredensial.";

      if (
        !err.response?.data?.error &&
        (err.response?.status === 400 || err.response?.status === 401)
      ) {
        msg = "Kredensial Administrator Tidak Valid.";
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50 flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-red-600/10 blur-[100px]" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />

      <div className="w-full max-w-md p-8 relative z-10 glass-card rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-orange-600 text-xl font-bold text-white shadow-lg mx-auto">
              A
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Gateway</h2>
          <p className="text-slate-300 text-xs mt-1">Otentikasi Keamanan Administrator</p>
        </div>

        {/* Session Notice Banner */}
        {sessionNotice && (
          <div className="mb-6 rounded-2xl bg-amber-500/15 p-3.5 text-xs text-amber-200 border border-amber-500/30 flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300">{sessionNotice}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/20 p-3.5 text-center text-xs text-red-200 border border-red-500/30 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 pl-1">
                Admin ID / Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-600"
                placeholder="Masukkan ID / Email Admin"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 pl-1">
                Kata Sandi (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 bg-linear-to-r from-red-600 to-red-900 shadow-red-600/25"
          >
            {isLoading ? "Memverifikasi..." : "Autentikasi Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6 flex items-center justify-center gap-1.5">
          <ShieldAlert size={13} />
          <span>Area Terbatas. Hanya untuk Personel Resmi.</span>
        </p>
      </div>
    </div>
  );
}
