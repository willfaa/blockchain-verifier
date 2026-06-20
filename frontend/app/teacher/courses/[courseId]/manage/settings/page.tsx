"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Lock,
  Upload,
  Image as ImageIcon,
  Save,
  Globe,
  Loader2,
  ShieldAlert,
  Terminal,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";
import { getAssetUrl } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CourseSettingsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    if (courseId) fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}`);
      const data = res.data.data;
      setCourse(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setCategoryId(data.categoryId || "");
      if (data.imageUrl) setPreviewUrl(data.imageUrl);
    } catch (err: any) {
      toast.error("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (categoryId) formData.append("categoryId", categoryId);
      if (selectedFile) formData.append("thumbnail", selectedFile);

      const res = await api.put(`/lms/courses/${courseId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCourse(res.data.data);
      toast.success("Course settings updated");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!course) return;
    const hasContent = course.modules && course.modules.length > 0;
    if (!course.isPublished && !hasContent) {
      toast.error("Cannot publish: Add at least one module first");
      return;
    }

    try {
      setPublishing(true);
      const res = await api.put(`/lms/courses/${courseId}`, {
        isPublished: !course.isPublished,
      });
      setCourse(res.data.data);
      toast.success(
        res.data.data.isPublished
          ? "Course is now live"
          : "Course is now hidden"
      );
    } catch (err: any) {
      toast.error("Failed to update visibility");
    } finally {
      setPublishing(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/lms/courses/${courseId}`);
      toast.success("Course has been deleted");
      router.push("/teacher/courses");
    } catch (err: any) {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading && !course) return <CyberpunkLoader text="Loading Settings..." />;

  const hasContent = course.modules && course.modules.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            Course Settings
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em] mt-1">
            Manage Course Configuration
          </p>
        </div>
        <button
          onClick={() => handleSaveChanges()}
          disabled={saving}
          className="group relative flex items-center gap-2 px-8 py-3 bg-cyan-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          {saving ? (
            <Loader2 size={16} className="animate-spin relative z-10" />
          ) : (
            <Save size={16} className="relative z-10" />
          )}
          <span className="relative z-10">
            {saving ? "Saving..." : "Save Changes"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50" />
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-cyan-500" />
              <h3 className="text-white font-black uppercase text-xs tracking-[0.3em]">
                Basic Information
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">
                  Course Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">
                  Course Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your course..."
                  rows={5}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/5 resize-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-orange-500" />
                  <h3 className="text-white font-black uppercase text-xs tracking-[0.3em]">
                    Visibility & Publishing
                  </h3>
                </div>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-tight max-w-sm">
                  {course.isPublished
                    ? "Status: Published and visible to students"
                    : "Status: Private draft (Hidden from students)"}
                </p>
                {!hasContent && !course.isPublished && (
                  <div className="flex items-center gap-2 text-fuchsia-500 text-[9px] font-black uppercase tracking-widest mt-4 bg-fuchsia-500/10 p-3 rounded-xl border border-fuchsia-500/20">
                    <AlertTriangle size={14} />
                    <span>Requirement: Add content before publishing</span>
                  </div>
                )}
              </div>

              <button
                onClick={togglePublish}
                disabled={publishing || (!hasContent && !course.isPublished)}
                className={`flex items-center gap-3 px-8 py-4 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all border group ${
                  course.isPublished
                    ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white"
                    : "bg-cyan-500 text-black border-cyan-500 hover:bg-cyan-400"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {publishing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : course.isPublished ? (
                  <EyeOff
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Eye
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                )}
                {publishing
                  ? "Processing..."
                  : course.isPublished
                  ? "Unpublish"
                  : "Publish Course"}
              </button>
            </div>
          </section>

          <section className="bg-fuchsia-500/[0.02] border border-fuchsia-500/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500 opacity-20 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={18} className="text-fuchsia-500" />
                  <h3 className="text-fuchsia-500 font-black uppercase text-xs tracking-[0.3em]">
                    Course Deletion
                  </h3>
                </div>
                <p className="text-slate-600 text-[10px] font-mono uppercase tracking-tight">
                  Permanently delete this course and all student data
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="px-8 py-4 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-fuchsia-500 hover:text-white transition-all shadow-[0_0_20px_rgba(217,70,239,0.1)] group-hover:shadow-[0_0_30px_rgba(217,70,239,0.2)]"
              >
                Delete Course
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
              <ImageIcon size={14} className="text-cyan-500" />
              Course Thumbnail
            </h3>

            <div
              className="relative aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer group hover:border-cyan-500/50 transition-all shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <>
                  <img
                    src={
                      previewUrl.startsWith("blob:")
                        ? previewUrl
                        : getAssetUrl(previewUrl)
                    }
                    alt="Preview"
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white text-black p-3 rounded-xl shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                      <Upload size={20} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-600 group-hover:text-cyan-500 transition-colors">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-4 group-hover:border-cyan-500/30">
                    <Upload size={24} />
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-widest">
                    Upload Image
                  </p>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="space-y-2 p-4 bg-white/[0.01] rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Recommended: 1280x720px
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
                Max File Size: 2MB
              </div>
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 space-y-6 backdrop-blur-xl group">
            <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-between">
              Curriculum Completion
              <span className="text-cyan-500 opacity-50 font-mono tracking-tighter">
                {Math.min((course.modules?.length || 0) * 20, 100)}%
              </span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                <span>Total Modules</span>
                <span
                  className={
                    course.modules?.length > 0
                      ? "text-cyan-400 font-black"
                      : "text-fuchsia-500 font-black"
                  }
                >
                  {String(course.modules?.length || 0).padStart(2, "0")}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(
                      (course.modules?.length || 0) * 20,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-[#0b0c24] border border-white/10 text-white rounded-[2.5rem] shadow-2xl backdrop-blur-xl max-w-lg">
          <AlertDialogHeader>
            <div className="w-20 h-20 rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-500 mb-8 mx-auto relative overflow-hidden">
              <ShieldAlert size={40} />
              <div className="absolute inset-0 bg-fuchsia-500/5 animate-pulse" />
            </div>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter text-center">
              Confirm Course Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium text-center text-sm px-6">
              You are about to delete the course{" "}
              <span className="text-white font-black underline decoration-fuchsia-500/50">
                "{course.title}"
              </span>
              . All modules, materials, and student progress will be permanently
              removed.{" "}
              <span className="text-fuchsia-500 font-black">
                THIS OPERATION IS IRREVERSIBLE.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 flex gap-4 font-mono text-[10px] uppercase tracking-[0.3em] w-full">
            <AlertDialogCancel className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-2xl py-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="flex-1 bg-fuchsia-500/20 border border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white rounded-2xl transition-all py-5 shadow-[0_0_40px_rgba(217,70,239,0.1)]"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
