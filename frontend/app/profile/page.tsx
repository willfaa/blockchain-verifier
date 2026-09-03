//frontend/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User, Edit, ArrowLeft, ShieldAlert, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import toast from "react-hot-toast";

import { getAvatarUrl } from "@/lib/utils";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Robust Token Retrieval
    const storageRaw =
      localStorage.getItem("chainnesa_user") || localStorage.getItem("user");
    let token = null;

    if (storageRaw) {
      try {
        const parsed = JSON.parse(storageRaw);
        token =
          parsed.token ||
          parsed.accessToken ||
          (typeof parsed === "string" ? parsed : null);
        // Pre-populate with cached session to avoid loading flash
        setUser(parsed);
      } catch (e) {
        token = storageRaw;
      }
    }

    if (!token) {
      router.push("/login");
      return;
    }

    // 2. Fetch fresh user data
    api
      .get("/auth/me")
      .then((res) => {
        const userData = res.data.data || res.data.user || res.data;
        if (userData) {
          setUser((prev: any) => ({ ...prev, ...userData }));
        }
      })
      .catch((err) => {
        console.error("Full Error Object:", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("chainnesa_user");
          localStorage.removeItem("user");
          router.push("/login");
        } else {
          const msg =
            err.response?.data?.error || err.message || "Unknown Error";
          toast.error(`Sync Failed: ${msg}`);
        }
      });
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0724] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center animate-pulse text-cyan-500 font-bold text-sm">
          Loading User Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0724] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 pt-28 px-4 pb-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#0d0b2f]/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          {/* Decorative Top Glow */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-lime"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-neon-purple/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Avatar */}
          <div className="flex justify-center mb-6 relative z-10">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl border-2 border-white/20 overflow-hidden shadow-[0_0_25px_rgba(176,38,255,0.25)] bg-slate-950/60 p-1">
              <div className="w-full h-full rounded-2xl overflow-hidden relative">
                {user.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name || "User"
                      )}&background=random`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black bg-gradient-to-tr from-neon-purple to-neon-blue text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center mb-6 relative z-10">
            <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
              {user.name}
            </h1>
            <p className="text-cyan-400 font-mono text-xs mb-3 bg-cyan-950/40 inline-block px-3 py-1 rounded-lg border border-cyan-900/50">
              {user.email || user.personalEmail}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-1">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-neon-purple/15 border border-neon-purple/30 text-xs text-white font-bold uppercase tracking-wider">
                {user.role === "admin" ? "Super Admin" : user.role}
              </div>
              {user.studyProgram && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-medium tracking-wide">
                  {user.studyProgram}
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div className="mb-6 p-4 bg-white/[0.03] rounded-2xl border border-white/5 relative z-10">
              <p className="text-slate-300 text-xs italic text-center leading-relaxed">
                "{user.bio}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 relative z-10">
            <button
              onClick={() => router.push("/profile/edit")}
              className="w-full flex items-center justify-center p-3.5 bg-gradient-to-r from-neon-purple to-neon-blue hover:opacity-90 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-neon-purple/20"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </button>

            {/* Role-Specific Portal Button */}
            {user.role === "admin" && (
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="w-full flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 text-neon-purple hover:text-white rounded-2xl font-bold text-sm transition-all border border-neon-purple/30 hover:border-neon-purple shadow-sm"
              >
                <ShieldAlert className="w-4 h-4 mr-2 text-neon-purple" /> Admin Console
              </button>
            )}

            {user.role === "teacher" && (
              <button
                onClick={() => router.push("/teacher/dashboard")}
                className="w-full flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white rounded-2xl font-bold text-sm transition-all border border-cyan-400/30 hover:border-cyan-400 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4 mr-2 text-cyan-400" /> Instructor Hub
              </button>
            )}

            {user.role === "student" && (
              <button
                onClick={() => router.push("/student/certificates")}
                className="w-full flex items-center justify-center p-3.5 bg-white/5 hover:bg-white/10 text-neon-blue hover:text-white rounded-2xl font-bold text-sm transition-all border border-neon-blue/30 hover:border-neon-blue shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 mr-2 text-neon-blue" /> My Credentials
              </button>
            )}

            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center justify-center p-3 bg-white/[0.02] hover:bg-white/5 text-slate-400 hover:text-white rounded-2xl font-semibold text-xs transition-all border border-white/5 hover:border-white/15"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
