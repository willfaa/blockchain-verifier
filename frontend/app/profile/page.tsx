//frontend/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User, Edit, LogOut } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import toast from "react-hot-toast";

import { getApiBase } from "@/lib/utils";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [errorDebug, setErrorDebug] = useState<string | null>(null);
  const router = useRouter();

  const getAvatarUrl = (path: string | null) => {
    if (!path) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.name || "User"
      )}&background=random`;
    }
    let cleanPath = path;
    if (cleanPath.startsWith("http://localhost:") || cleanPath.startsWith("http://127.0.0.1:")) {
      cleanPath = cleanPath.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, "");
    }
    if (cleanPath.startsWith("http")) return cleanPath; // Already a full URL (e.g. Google Auth)
    return `${getApiBase()}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`; // Append Backend Domain
  };

  useEffect(() => {
    // 1. Robust Token Retrieval
    const storageRaw =
      localStorage.getItem("chainnesa_user") || localStorage.getItem("user"); // Check potential keys
    let token = null;

    if (storageRaw) {
      try {
        const parsed = JSON.parse(storageRaw);
        // Check if token is at root or inside a property
        token =
          parsed.token ||
          parsed.accessToken ||
          (typeof parsed === "string" ? parsed : null);
      } catch (e) {
        // If it's just a raw string token
        token = storageRaw;
      }
    }

    // Debug: Check if token exists
    if (!token) {
      setErrorDebug(
        "No token found in 'chainnesa_user' or 'user' storage. Please Login again."
      );
      return;
    }

    // 2. Fetch with Smart Error Handling
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
      })
      .catch((err) => {
        console.error("Full Error Object:", err);

        // LOGIC FIX: Only redirect if token is strictly INVALID (401)
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("chainnesa_user");
          localStorage.removeItem("user");
          router.push("/login");
        } else {
          // Show error message via Toast instead of crashing page
          const msg =
            err.response?.data?.error || err.message || "Unknown Error";
          toast.error(`Sync Failed: ${msg}`);
          // Optional: Set user to null or partial data if needed, but keeping it null shows loading state forever.
          // Better might be to not set user, so loading spinner stays, but toast explains why.
        }
      });
  }, []);

  // Removed Debug UI Block

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0724] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center animate-pulse text-cyan-500">
          Loading User Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0724] flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 pt-24 px-4 pb-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#0d0b2f]/80 border border-teal-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl shadow-teal-900/10">
          {/* Decorative Background Element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-purple-600"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"></div>

          {/* Avatar */}
          <div className="flex justify-center mb-8 relative z-10">
            <div className="w-32 h-32 rounded-full border-4 border-[#0b0724] outline outline-2 outline-teal-500/50 overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              <img
                src={getAvatarUrl(user.avatar)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (
                    e.target as HTMLImageElement
                  ).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}&background=random`;
                }}
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center mb-8 relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">{user.name}</h1>
            <p className="text-teal-400 font-mono text-sm mb-4 bg-teal-950/30 inline-block px-3 py-1 rounded border border-teal-900/50">
              {user.email || user.personalEmail}
            </p>

            <div className="flex justify-center gap-2 mt-2">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#1a163f] border border-white/10 text-xs text-slate-300 font-medium uppercase tracking-wider">
                {user.role}
              </div>
              {user.studyProgram && (
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#1a163f] border border-white/10 text-xs text-slate-300 font-medium uppercase tracking-wider">
                  {user.studyProgram}
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div className="mb-8 p-6 bg-black/20 rounded-xl border border-white/5 relative z-10">
              <p className="text-slate-300 text-sm italic text-center leading-relaxed">
                "{user.bio}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 relative z-10">
            <button
              onClick={() => router.push("/profile/edit")}
              className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-900/20"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center justify-center p-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-semibold transition-all border border-white/10 hover:border-white/20"
            >
              <User className="w-4 h-4 mr-2 hidden" />{" "}
              {/* Dummy hidden icon to keep import valid or just remove it if needed, but safer to replace Icon */}
              <LogOut className="w-4 h-4 mr-2 rotate-180" /> Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
