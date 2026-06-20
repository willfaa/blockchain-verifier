"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Lock, Camera, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, login } = useAuth(); // login used to update context
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  // Preview for avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setPersonalEmail(user.personalEmail || "");

      if (user.avatar) {
        let cleanAvatar = user.avatar;
        if (cleanAvatar.startsWith("http://localhost:") || cleanAvatar.startsWith("http://127.0.0.1:")) {
          cleanAvatar = cleanAvatar.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, "");
        }
        if (cleanAvatar.startsWith("http") || cleanAvatar.startsWith("blob")) {
          setAvatarPreview(cleanAvatar);
        } else {
          setAvatarPreview(`${API_BASE_URL}${cleanAvatar}`);
        }
      } else {
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  const handleSave = async () => {
    // 1. Guard Clause: Prevent empty name
    if (!name || name.trim() === "") {
      toast.error("Name cannot be empty!", { icon: "⚠️" });
      return;
    }

    // 2. Guard Clause: Prevent empty personal email
    if (!personalEmail || personalEmail.trim() === "") {
      toast.error("Personal Email is required!", { icon: "⚠️" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("personalEmail", personalEmail);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Headers are handled automatically by Axios + Browser (Multipart Boundary)
      const res = await api.put("/users/profile", formData);

      const currentUser = JSON.parse(
        localStorage.getItem("chainnesa_user") || "{}",
      );
      const updatedUserWithToken = {
        ...currentUser,
        ...res.data.data, // Backend returns { ok: true, data: ... }
      };

      // Ensure token is definitely there (fallback)
      if (!updatedUserWithToken.token && currentUser.token) {
        updatedUserWithToken.token = currentUser.token;
      }

      login(updatedUserWithToken, null);

      // Redirect back to profile
      router.push("/profile");
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Failed to update profile", err);
      toast.error(
        "Failed to update profile: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // or loading spinner

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20 font-sans selection:bg-neon-lime/30">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-dark-bg/80 px-8 py-6 backdrop-blur-xl border-b border-white/5">
        <Link
          href="/profile"
          className="text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
        >
          Cancel
        </Link>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          Edit <span className="neon-text-lime">Profile</span>
        </h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="font-black text-neon-lime hover:text-white disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] transition-colors"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="mx-auto max-w-xl px-10 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Avatar Section */}
        <div className="flex justify-center mb-12 relative group">
          <div className="absolute inset-0 bg-neon-lime/5 blur-3xl rounded-full"></div>
          <label className="relative cursor-pointer w-40 h-40 rounded-3xl overflow-hidden border border-white/10 p-1 bg-white/[0.02] hover:border-neon-lime/50 transition-all duration-500 transform hover:scale-105 shadow-2xl">
            {/* The Image */}
            <div className="w-full h-full rounded-2xl overflow-hidden relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-black bg-neon-lime text-black">
                  {name.charAt(0)}
                </div>
              )}

              {/* The Hover Overlay */}
              <div className="absolute inset-0 bg-dark-bg/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Camera className="text-neon-lime w-10 h-10" />
              </div>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Form Fields */}
        <div className="space-y-8">
          {/* Name */}
          <div className="space-y-3">
            <label className="text-neon-lime text-[10px] uppercase font-black tracking-[0.3em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-lime animate-pulse" />{" "}
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-neon-lime/50 focus:bg-white/[0.05] transition-all font-bold"
              placeholder="Enter Full Name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <label className="text-neon-purple text-[10px] uppercase font-black tracking-[0.3em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" />{" "}
              Biography
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.05] transition-all resize-none font-bold"
              placeholder="Write a brief description about yourself..."
            />
            <p className="text-right text-[10px] font-black text-white/20 uppercase tracking-widest mt-2">
              {bio.length} / 150{" "}
              <span className="text-neon-purple italic">Limit</span>
            </p>
          </div>

          {/* Personal Email */}
          <div className="space-y-3">
            <label className="text-neon-blue text-[10px] uppercase font-black tracking-[0.3em] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />{" "}
              Personal Email
            </label>
            <input
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.05] transition-all font-bold"
              placeholder="user@example.com"
            />
          </div>

          {/* Locked Info */}
          <div className="pt-10 mt-10 border-t border-white/5 space-y-6">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4 flex items-center gap-4">
              Academic Information{" "}
              <span
                className="text-neon-purple shrink-0 hover:text-white transition-colors cursor-help"
                title="These fields are managed by the institution"
              >
                (Read Only)
              </span>
              <div className="h-px w-full bg-white/5"></div>
            </h3>

            <div className="space-y-4">
              <div className="glass-panel p-6 rounded-2xl border-white/5 relative group">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">
                  Institutional Email
                </label>
                <div className="flex items-center text-white font-bold text-sm">
                  {user.email}
                  <Lock
                    size={12}
                    className="ml-auto text-white/10 group-hover:text-neon-purple transition-colors"
                  />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/5 relative group">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">
                  {user.role === "student" ? "Major" : "Department"}
                </label>
                <div className="flex items-center text-white font-bold text-sm">
                  {user.majority}{" "}
                  {user.studyProgram ? `// ${user.studyProgram}` : ""}
                  <Lock
                    size={12}
                    className="ml-auto text-white/10 group-hover:text-neon-purple transition-colors"
                  />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border-white/5 relative group">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">
                  {user.role === "student"
                    ? "Student ID"
                    : "Employee ID (NIP)"}
                </label>
                <div className="flex items-center text-white font-bold text-sm">
                  {user.role === "student" ? user.studentId : user.nip}
                  <Lock
                    size={12}
                    className="ml-auto text-white/10 group-hover:text-neon-purple transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
