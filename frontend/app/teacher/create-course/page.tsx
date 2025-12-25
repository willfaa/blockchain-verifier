// frontend/app/teacher/create-course/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft,
  Upload,
  Save,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function CreateCoursePage() {
  const router = useRouter();

  // State Form
  const [form, setForm] = useState({ title: "", description: "" });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Handle Upload Gambar & Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      // Buat preview URL agar user bisa melihat gambar yg dipilih
      const objectUrl = URL.createObjectURL(file);
      setThumbnailPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);

      // Ambil ID Teacher dari LocalStorage
      // Note: Backend butuh 'teacherId'.
      const userStr = localStorage.getItem("chainnesa_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        formData.append("teacherId", user.id);
      }

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      await api.post("/lms/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Redirect ke dashboard setelah sukses
      router.push("/teacher/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Failed to create course: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* --- Header Section --- */}
      <div className="mb-8">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Create New Course
        </h1>
        <p className="text-slate-400 mt-1">
          Fill in the details to publish a new learning material.
        </p>
      </div>

      {/* --- Form Card --- */}
      <div className="bg-[#0d0b2f]/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Hiasan Background di dalam card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kolom Kiri: Upload Thumbnail */}
            <div className="lg:col-span-1 space-y-4">
              <label className="block text-sm font-semibold text-slate-300">
                Course Thumbnail
              </label>

              <div
                className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden group ${
                  thumbnailPreview
                    ? "border-cyan-500/50 bg-slate-900"
                    : "border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />

                {thumbnailPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <div className="p-3 rounded-full bg-white/5 mb-2 group-hover:bg-cyan-400/10 transition-colors">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-xs font-medium">Click to upload</span>
                    <span className="text-[10px] opacity-60">
                      JPG, PNG (Max 5MB)
                    </span>
                  </div>
                )}

                {/* Overlay Edit jika sudah ada gambar */}
                {thumbnailPreview && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                    <span className="flex items-center gap-2 text-white font-medium text-sm">
                      <Upload size={14} /> Change Image
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Input Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Course Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Blockchain Technology"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe what students will learn in this course..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950 px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
