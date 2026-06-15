"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MAJORITIES, ACADEMIC_DATA } from "@/lib/constants/academics";
import { generateEmailVariations } from "@/lib/emailGenerator";
import { RefreshCw, ChevronDown, X } from "lucide-react";
import toast from "react-hot-toast";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Form States ---
  const [name, setName] = useState("");
  const [emailUsername, setEmailUsername] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailOptions, setEmailOptions] = useState<string[]>([]);
  const [emailIndex, setEmailIndex] = useState(0);

  // Specific Fields
  const [nim, setNim] = useState(""); // Student Only
  const [nip, setNip] = useState(""); // Teacher Only

  // Academic Fields
  const [majority, setMajority] = useState(""); // Jurusan / Dept
  const [program, setProgram] = useState(""); // Prodi / Keahlian

  // --- Auto-Generate Email Logic ---
  useEffect(() => {
    if (name) {
      const opts = generateEmailVariations(name);
      setEmailOptions(opts);
      if (opts.length > 0) {
        setEmailUsername(opts[0]);
        setEmailIndex(0);
      }
    }
  }, [name]);

  const handleRandomizeEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    if (emailOptions.length === 0) return;

    const nextIndex = (emailIndex + 1) % emailOptions.length;
    setEmailIndex(nextIndex);
    setEmailUsername(emailOptions[nextIndex]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- STRICT VALIDATION START ---
    if (!MAJORITIES.includes(majority)) {
      toast.error("Please select a valid Department from the list.", {
        icon: "🧐",
      });
      setLoading(false);
      return;
    }

    const validPrograms = ACADEMIC_DATA[majority] || [];
    if (!validPrograms.includes(program)) {
      toast.error("Please select a valid Study Program.", { icon: "🧐" });
      setLoading(false);
      return;
    }
    // --- STRICT VALIDATION END ---

    const fullInstitutionalEmail = `${emailUsername}@chainnesa.com`;

    try {
      // Payload matches updated Backend AuthController expectation
      const payload: any = {
        name,
        email: fullInstitutionalEmail, // The Generated ID
        personalEmail, // The Recovery Email
        password,
        role,
        majority,
        studyProgram: program,
      };

      if (role === "student") {
        payload.nim = nim;
      } else {
        payload.nip = nip;
      }

      // 1. Kirim ke Backend
      const res = await api.post("/auth/register", payload);

      // 2. Redirect to Success Page (No Auto Login)
      router.push("/register/success");
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.message || "Registration failed";
      // setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50 flex items-center justify-center py-10">
      <div className="w-full max-w-lg p-8 glass-card rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create Account</h2>
          <p className="text-slate-300 text-sm mt-1">
            Join Chainnesa Learning Platform
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-200 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role Switcher */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                role === "student"
                  ? "bg-cyan-500 text-white shadow-lg"
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
                  ? "bg-fuchsia-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Teacher
            </button>
          </div>

          {/* --- Global Fields --- */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Full Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="e.g. John Doe"
            />
          </div>

          {/* INSTITUTIONAL ID GENERATOR */}
          <div>
            <label className="block text-teal-400 mb-2 font-mono text-sm uppercase tracking-wide">
              Institutional ID (Email)
            </label>
            <div className="relative flex items-center">
              {/* The Input Field */}
              <input
                type="text"
                value={emailUsername}
                onChange={(e) => setEmailUsername(e.target.value)}
                className="w-full bg-slate-900 border border-teal-500/50 rounded-l p-3 text-white focus:outline-none focus:border-teal-400 pr-12 font-mono"
                placeholder="username"
              />

              {/* The Fixed Domain Suffix */}
              <div className="bg-slate-800 border-y border-r border-teal-500/50 p-3 text-slate-400 select-none font-mono text-sm">
                @chainnesa.com
              </div>

              {/* Randomizer Button */}
              <button
                onClick={handleRandomizeEmail}
                className="absolute right-[145px] top-1/2 -translate-y-1/2 p-2 text-teal-500 hover:text-white hover:bg-teal-500/20 rounded-full transition-all"
                title="Generate distinct ID"
                type="button"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Auto-generated based on your name. Click refresh icon to cycle
              options.
            </p>
          </div>

          {/* PERSONAL EMAIL - RECOVERY */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Personal Email (Recovery)
            </label>
            <input
              type="email"
              required
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="you@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              onChange={(e) => {
                if (e.target.value !== password) {
                  // Optional: Real-time validation style, but here we just store local or validate on submit
                  e.target.setCustomValidity("Passwords do not match");
                } else {
                  e.target.setCustomValidity("");
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* --- Role Specific Fields --- */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {role === "student" ? "Student Details" : "Academic Details"}
            </h3>

            {/* NIM or NIP */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                {role === "student" ? "NIM (Student ID)" : "NIP (Teacher ID)"}
              </label>
              <input
                required
                value={role === "student" ? nim : nip}
                onChange={(e) =>
                  role === "student"
                    ? setNim(e.target.value)
                    : setNip(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder={
                  role === "student" ? "e.g. 1805097..." : "e.g. 198001..."
                }
              />
            </div>

            {/* Academic Info (Shared) */}
            <div className="space-y-4">
              {/* Majority Combobox */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {role === "student" ? "Major (Jurusan)" : "Department"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  value={majority}
                  onChange={(val) => {
                    setMajority(val);
                    setProgram(""); // Reset program when majority changes
                  }}
                  options={MAJORITIES}
                  placeholder="Select Department..."
                  emptyMessage="No major found."
                />
              </div>

              {/* Study Program Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {role === "student"
                    ? "Study Program (Prodi)"
                    : "Homebase / Expertise"}
                </label>
                <select
                  required
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  disabled={!majority || !ACADEMIC_DATA[majority]}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                >
                  <option value="">-- Select Program --</option>
                  {majority &&
                    ACADEMIC_DATA[majority]?.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold text-slate-950 shadow-lg mt-4 disabled:opacity-50 ${
              role === "student"
                ? "bg-linear-to-r from-cyan-400 to-blue-500"
                : "bg-linear-to-r from-fuchsia-500 to-orange-400"
            }`}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-white hover:underline font-semibold"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
