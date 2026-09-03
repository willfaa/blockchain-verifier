// frontend/app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api"; // Import API helper
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "session_expired") {
        setError("Your session has expired. Please log in again.");
      } else if (err === "session_overwritten") {
        setError("You have been logged out because another login session was started.");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Gunakan api.post (base URL http://localhost:4000/api otomatis)
      // Endpoint backend kita sekarang: /auth/login
      const res = await api.post("/auth/login", {
        identifier,
        password,
        role,
      });

      // Response backend: { ok: true, user: { ... } }
      const userData = res.data.user;
      login(userData);

      // ROLE BASED REDIRECT
      if (userData.role === "admin") {
        router.push("/admin/dashboard");
      } else if (userData.role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        // Student
        // Check for redirect param
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        // Fix for Student 404: Default to /courses
        router.push(redirect || "/courses");
      }

      toast.success("Welcome back! ⚡");
    } catch (err: any) {
      // Handle error dari axios
      let msg = err.response?.data?.error || "Login failed";

      // Fallback for generic 400/401 without specific message
      if (
        !err.response?.data?.error &&
        (err.response?.status === 400 || err.response?.status === 401)
      ) {
        msg = "Invalid Email/ID or Password. Please try again.";
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... (KODE UI DI BAWAH INI SAMA PERSIS DENGAN FILE LAMA ANDA) ...
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
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-xl font-semibold text-slate-950 shadow-lg mx-auto">
              Cn
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-slate-300 text-sm mt-2">
            Sign in to access your learning dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-200 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                role === "student"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                role === "teacher"
                  ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Teacher
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 pl-1">
                Email / ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="Enter your Email, NIP, or Student ID"
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              role === "student"
                ? "bg-linear-to-r from-cyan-400 to-blue-500 shadow-cyan-500/25"
                : "bg-linear-to-r from-fuchsia-500 to-orange-400 shadow-fuchsia-500/25"
            }`}
          >
            {isLoading
              ? "Signing In..."
              : `Sign In as ${role === "student" ? "Student" : "Teacher"}`}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-white hover:underline font-semibold"
          >
            Register for free
          </Link>
        </p>
      </div>
    </div>
  );
}
