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

  const API_BASE_URL = "http://localhost:4000";

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setPersonalEmail(user.personalEmail || "");

      if (user.avatar) {
        if (user.avatar.startsWith("http") || user.avatar.startsWith("blob")) {
          setAvatarPreview(user.avatar);
        } else {
          setAvatarPreview(`${API_BASE_URL}${user.avatar}`);
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
        localStorage.getItem("chainnesa_user") || "{}"
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
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // or loading spinner

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-950/80 px-4 py-4 backdrop-blur border-b border-white/10">
        <Link
          href="/"
          className="text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>
        <h1 className="text-lg font-bold">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="font-bold text-teal-400 hover:text-teal-300 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Done"}
        </button>
      </div>

      <div className="mx-auto max-w-xl px-6 py-8">
        {/* Avatar Section (Instagram Style Overlay) */}
        <div className="flex justify-center mb-8">
          <label className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 hover:border-teal-500 transition-colors">
            {/* The Image */}
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-linear-to-tr from-cyan-500 to-blue-600">
                {name.charAt(0)}
              </div>
            )}

            {/* The Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="text-white w-8 h-8" />
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
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-slate-700 py-2 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              placeholder="Your Name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-b border-slate-700 py-2 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none transition-colors resize-none"
              placeholder="Write a short bio..."
            />
            <p className="text-right text-[10px] text-slate-600">
              {bio.length}/150
            </p>
          </div>

          {/* Personal Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Personal Email
            </label>
            <input
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              className="w-full bg-transparent border-b border-slate-700 py-2 text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none transition-colors"
              placeholder="you@gmail.com"
            />
          </div>

          {/* Locked Info */}
          <div className="pt-6 mt-8 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
              Academic Identity{" "}
              <span className="text-[10px] font-normal normal-case ml-1 opacity-50">
                (Locked)
              </span>
            </h3>

            <div className="space-y-5 opacity-60">
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-500">
                  Institutional ID
                </label>
                <div className="flex items-center text-slate-300 font-mono text-sm py-1 border-b border-slate-800">
                  {user.email}
                  <Lock size={12} className="ml-auto text-slate-600" />
                </div>
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-500">
                  {user.role === "student"
                    ? "Major - Study Program"
                    : "Department - Homebase"}
                </label>
                <div className="flex items-center text-slate-300 text-sm py-1 border-b border-slate-800">
                  {user.majority}{" "}
                  {user.studyProgram ? `- ${user.studyProgram}` : ""}
                  <Lock size={12} className="ml-auto text-slate-600" />
                </div>
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-slate-500">
                  {user.role === "student" ? "NIM" : "NIP"}
                </label>
                <div className="flex items-center text-slate-300 font-mono text-sm py-1 border-b border-slate-800">
                  {user.role === "student" ? user.nim : user.nip}
                  <Lock size={12} className="ml-auto text-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
