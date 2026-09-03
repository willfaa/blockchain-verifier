"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Lock, Camera, ArrowLeft, Shield, Check, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import { getApiBase, compressAndResizeImage } from "@/lib/utils";

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
          setAvatarPreview(`${getApiBase()}${cleanAvatar.startsWith("/") ? cleanAvatar : `/${cleanAvatar}`}`);
        }
      } else {
        setAvatarPreview(null);
      }
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress & crop to square (1:1 aspect ratio), maximum 300x300 pixels, quality 0.85
        const compressed = await compressAndResizeImage(file, {
          maxWidth: 300,
          maxHeight: 300,
          aspectRatio: 1,
          quality: 0.85,
        });
        setAvatarFile(compressed);
        const objectUrl = URL.createObjectURL(compressed);
        setAvatarPreview(objectUrl);
        toast.success("Photo selected! Click 'Save Changes' to apply.", { icon: "📸" });
      } catch (err: any) {
        console.error("Failed to process avatar:", err.message);
        toast.error("Failed to process image. Using original file.", { icon: "⚠️" });
        setAvatarFile(file);
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);
      }
    }
  };

  const handleSave = async () => {
    // 1. Guard Clause: Prevent empty name
    if (!name || name.trim() === "") {
      toast.error("Name cannot be empty!", { icon: "⚠️" });
      return;
    }

    // 2. Optional validation: If personal email is provided, check format
    if (personalEmail && personalEmail.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalEmail.trim())) {
        toast.error("Please enter a valid personal email address!", { icon: "⚠️" });
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("bio", bio.trim());
      formData.append("personalEmail", personalEmail.trim());
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
        ...(res.data.data || res.data.user || {}),
      };

      // Ensure token is definitely there (fallback)
      if (!updatedUserWithToken.token && currentUser.token) {
        updatedUserWithToken.token = currentUser.token;
      }

      login(updatedUserWithToken, null);

      // Redirect back to profile
      router.push("/profile");
      toast.success("Profile updated successfully! ✨");
    } catch (err: any) {
      console.error("Failed to update profile", err);
      const errMsg = err.response?.data?.error;
      const errorText =
        typeof errMsg === "object"
          ? errMsg.message || JSON.stringify(errMsg)
          : errMsg || err.message;
      toast.error("Failed to update profile: " + errorText);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20 font-sans selection:bg-neon-lime/30">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-dark-bg/80 px-6 md:px-10 py-5 backdrop-blur-xl border-b border-white/5">
        <Link
          href="/profile"
          className="text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <h1 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">
          Edit <span className="neon-text-lime">Profile</span>
        </h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="font-black text-neon-lime hover:text-white disabled:opacity-50 text-xs uppercase tracking-widest transition-colors px-4 py-2 rounded-xl bg-neon-lime/10 hover:bg-neon-lime/20 border border-neon-lime/30 shadow-lg shadow-neon-lime/10"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="mx-auto max-w-xl px-6 md:px-10 py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center mb-10 relative group">
          <div className="absolute inset-0 bg-neon-lime/5 blur-3xl rounded-full pointer-events-none"></div>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer w-36 h-36 md:w-40 md:h-40 rounded-3xl overflow-hidden border border-white/15 p-1 bg-white/[0.02] hover:border-neon-lime/50 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            {/* The Image */}
            <div className="w-full h-full rounded-2xl overflow-hidden relative bg-black/40">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-black bg-gradient-to-tr from-neon-purple to-neon-blue text-white">
                  {name.charAt(0).toUpperCase() || "U"}
                </div>
              )}

              {/* The Hover Overlay */}
              <div className="absolute inset-0 bg-dark-bg/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-xs gap-1">
                <Camera className="text-neon-lime w-8 h-8" />
                <span className="text-[10px] font-bold text-neon-lime uppercase tracking-wider">
                  Change Photo
                </span>
              </div>
            </div>
          </div>

          {/* Explicit Upload Photo Trigger Button */}
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neon-lime bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-lime/40 transition-all shadow-sm"
            >
              <UploadCloud size={15} />
              {avatarFile ? "Change Selected Photo" : "Upload New Photo"}
            </button>
            {avatarFile && (
              <p className="text-[10px] text-neon-lime/80 font-medium flex items-center gap-1">
                <Check size={12} /> New photo ready to save
              </p>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-neon-lime text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-lime animate-pulse" />{" "}
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-lime/50 focus:bg-white/[0.05] transition-all font-bold text-sm"
              placeholder="Enter Full Name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-neon-purple text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" />{" "}
              Biography
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={150}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.05] transition-all resize-none font-medium text-sm"
              placeholder="Write a brief description about yourself..."
            />
            <p className="text-right text-[10px] font-bold text-white/30 uppercase tracking-widest">
              {bio.length} / 150 <span className="text-neon-purple">Limit</span>
            </p>
          </div>

          {/* Personal Email */}
          <div className="space-y-2">
            <label className="text-neon-blue text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />{" "}
              Personal Email{" "}
              <span className="text-white/30 text-[9px] font-normal normal-case">
                (Optional)
              </span>
            </label>
            <input
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.05] transition-all font-medium text-sm"
              placeholder="user@example.com"
            />
          </div>

          {/* Locked / System Info */}
          <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3">
              {user.role === "admin" ? "System Privileges" : "Academic Information"}
              <span
                className="text-neon-purple shrink-0 hover:text-white transition-colors cursor-help"
                title="These institutional fields cannot be modified manually"
              >
                (Read Only)
              </span>
              <div className="h-px flex-1 bg-white/5"></div>
            </h3>

            <div className="space-y-3">
              {/* Institutional Email */}
              <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] relative group">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                  Institutional Email
                </label>
                <div className="flex items-center text-white font-bold text-sm">
                  {user.email}
                  <Lock
                    size={12}
                    className="ml-auto text-white/20 group-hover:text-neon-purple transition-colors"
                  />
                </div>
              </div>

              {/* Role specific items */}
              {user.role === "admin" ? (
                <>
                  <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] relative group">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                      System Role
                    </label>
                    <div className="flex items-center text-white font-bold text-sm gap-2">
                      <Shield size={14} className="text-neon-purple" />
                      Administrator (Super Admin)
                      <Lock
                        size={12}
                        className="ml-auto text-white/20 group-hover:text-neon-purple transition-colors"
                      />
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] relative group">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                      Console Access
                    </label>
                    <div className="flex items-center text-slate-300 font-medium text-xs">
                      Full Administrative & Blockchain Ledger Privileges
                      <Lock
                        size={12}
                        className="ml-auto text-white/20 group-hover:text-neon-purple transition-colors"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] relative group">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                      {user.role === "student" ? "Major" : "Department"}
                    </label>
                    <div className="flex items-center text-white font-bold text-sm">
                      {user.majority || "General"}{" "}
                      {user.studyProgram ? `// ${user.studyProgram}` : ""}
                      <Lock
                        size={12}
                        className="ml-auto text-white/20 group-hover:text-neon-purple transition-colors"
                      />
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] relative group">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                      {user.role === "student"
                        ? "Student ID (NIM/NISN)"
                        : "Employee ID (NIP)"}
                    </label>
                    <div className="flex items-center text-white font-bold text-sm">
                      {user.role === "student" ? user.studentId || "-" : user.nip || "-"}
                      <Lock
                        size={12}
                        className="ml-auto text-white/20 group-hover:text-neon-purple transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
