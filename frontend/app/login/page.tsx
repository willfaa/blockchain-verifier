// frontend/app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear dangling stale session token on mount
      localStorage.removeItem("chainnesa_user");

      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "session_expired") {
        setSessionNotice("Sesi login Anda telah berakhir. Silakan masuk kembali.");
      } else if (err === "session_overwritten") {
        setSessionNotice("Akun Anda telah keluar karena login baru dimulai di perangkat/tab lain.");
      }

      // Automatically clean the error parameter from address bar
      if (err) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
        role,
      });

      const userData = res.data.user;
      login(userData, null);

      toast.success(`Selamat datang kembali, ${userData.name || "User"}! ⚡`);

      // ROLE BASED REDIRECT
      if (userData.role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        router.push(redirect || "/courses");
      }
    } catch (err: any) {
      let msg = err.response?.data?.error || "Login gagal, silakan coba lagi.";

      if (
        !err.response?.data?.error &&
        (err.response?.status === 400 || err.response?.status === 401)
      ) {
        msg = "Email/ID atau Password salah. Silakan periksa kembali.";
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50 flex items-center justify-center relative overflow-hidden">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium z-20"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[100px]" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px]" />

      <div className="w-full max-w-md p-8 relative z-10 glass-card rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-xl font-bold text-slate-950 shadow-lg mx-auto">
              Cn
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Selamat Datang</h2>
          <p className="text-slate-300 text-xs mt-1">
            Masuk ke portal pembelajaran & verifikasi blockchain
          </p>
        </div>

        {/* Session Expired / Overwritten Notice Banner */}
        {sessionNotice && (
          <div className="mb-5 rounded-2xl bg-amber-500/15 p-3.5 text-xs text-amber-200 border border-amber-500/30 flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300">{sessionNotice}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl bg-red-500/20 p-3.5 text-center text-xs text-red-200 border border-red-500/30 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Role Selector Tabs (Student vs Teacher) */}
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                role === "student"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Siswa (Student)
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                role === "teacher"
                  ? "bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Guru (Teacher)
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 pl-1">
                {role === "teacher" ? "Email / NIP Guru" : "Email / NISN / ID Siswa"}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                placeholder={
                  role === "teacher"
                    ? "contoh: guru@chainnesa.com atau NIP"
                    : "contoh: siswa@chainnesa.com atau NISN"
                }
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
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 shadow-lg transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 ${
              role === "student"
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-cyan-500/25"
                : "bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white shadow-fuchsia-500/25"
            }`}
          >
            {isLoading
              ? "Memproses Masuk..."
              : `Masuk sebagai ${role === "student" ? "Siswa" : "Guru"}`}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-white/5">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-white hover:underline font-semibold"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
