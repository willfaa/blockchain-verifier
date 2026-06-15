// frontend/components/AuthModal.tsx
"use client";

import React, { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";

type AuthMode = "login" | "register";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("student");

  // Login States
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register States
  const [regName, setRegName] = useState("");
  const [regPass, setRegPass] = useState("");
  // Student
  const [regStudentId, setRegStudentId] = useState("");
  const [regMajority, setRegMajority] = useState("");
  const [regProgram, setRegProgram] = useState("");
  // Teacher
  const [regNip, setRegNip] = useState("");
  const [regLectureMajority, setRegLectureMajority] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorV, setErrorV] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorV(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          identifier: loginId,
          password: loginPass,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Login success -> update state without redirect
      login(data.user, null);
      onClose();
    } catch (err: any) {
      setErrorV(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorV(null);

    try {
      const payload: any = {
        role,
        name: regName,
        password: regPass,
      };

      if (role === "student") {
        payload.studentId = regStudentId;
        payload.majority = regMajority;
        payload.program = regProgram;
      } else {
        payload.nip = regNip;
        payload.lectureMajority = regLectureMajority;
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto login after register without redirect
      login(data.user, null);
      onClose();
    } catch (err: any) {
      setErrorV(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-3xl border border-white/10 bg-[#0d0b2f]/95 p-6 shadow-2xl shadow-black/50 transition-all sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path
              fillRule="evenodd"
              d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {mode === "login"
              ? "Sign in to access your blockchain credentials"
              : "Join Chainnesa to start your learning journey"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 flex rounded-xl bg-slate-950/50 p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === "login"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              mode === "register"
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Role Switcher */}
        <div className="mb-6 flex justify-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === "student"}
              onChange={() => setRole("student")}
              className="hidden"
            />
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                role === "student"
                  ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Student
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="role"
              value="teacher"
              checked={role === "teacher"}
              onChange={() => setRole("teacher")}
              className="hidden"
            />
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                role === "teacher"
                  ? "bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/50"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Teacher
            </span>
          </label>
        </div>

        {errorV && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-200">
            {errorV}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Identifier (Student ID / NIP)
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="e.g. 192837465"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-linear-to-r from-cyan-400 to-blue-500 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Switcher moved to top */}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {role === "student" ? (
                <>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Student ID
                    </label>
                    <input
                      required
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Prodi (Program)
                    </label>
                    <input
                      required
                      value={regProgram}
                      onChange={(e) => setRegProgram(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Major (Jurusan)
                    </label>
                    <input
                      required
                      value={regMajority}
                      onChange={(e) => setRegMajority(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-300">
                      NIP
                    </label>
                    <input
                      required
                      value={regNip}
                      onChange={(e) => setRegNip(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Teaching Majority
                    </label>
                    <input
                      required
                      value={regLectureMajority}
                      onChange={(e) => setRegLectureMajority(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-linear-to-r from-fuchsia-500 to-amber-400 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
