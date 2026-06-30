"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "@/lib/api";
import {
  Save,
  Upload,
  ImageIcon,
  CheckSquare,
  ChevronDown,
  X,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import RichTextEditor from "@/components/features/RichTextEditor";
import { useParams } from "next/navigation";
import { ACADEMIC_DATA, MAJORITIES } from "@/lib/constants/academics";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";
import { getAssetUrl, compressAndResizeImage } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function CourseBasicsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    category: "", // Maps to Majority
  });

  const [allowedPrograms, setAllowedPrograms] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Certificate settings states
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [certPreviewModalOpen, setCertPreviewModalOpen] = useState(false);
  const [certPreviewLoading, setCertPreviewLoading] = useState(false);
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);
  const [systemLayout, setSystemLayout] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchSystemLayout();
    setMounted(true);
  }, [courseId]);

  const fetchSystemLayout = async () => {
    try {
      const res = await api.get("/lms/settings");
      if (res.data.ok && res.data.settings) {
        setSystemLayout(res.data.settings.certificateLayout || "HORIZONTAL");
      }
    } catch (err) {
      console.error("Failed to fetch system layout:", err);
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}`);
      if (res.data.ok) {
        const course = res.data.data;
        setFormData({
          title: course.title || "",
          description: course.description || "",
          thumbnail: course.imageUrl || "", // Schema uses imageUrl
          category: course.categoryId || "", // Schema uses categoryId
        });

        // Handle allowedPrograms
        if (Array.isArray(course.allowedPrograms)) {
          setAllowedPrograms(course.allowedPrograms);
        } else if (typeof course.allowedPrograms === "string") {
          try {
            setAllowedPrograms(JSON.parse(course.allowedPrograms));
          } catch (e) {
            setAllowedPrograms([]);
          }
        }

        if (course.imageUrl) {
          setPreviewImage(getAssetUrl(course.imageUrl));
        }

        if (course.certificateTemplate) {
          setCertPreview(getAssetUrl(course.certificateTemplate));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMajorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, category: e.target.value });
  };

  const handleProgramToggle = (program: string) => {
    setAllowedPrograms((prev) =>
      prev.includes(program)
        ? prev.filter((p) => p !== program)
        : [...prev, program]
    );
  };

  const handleSelectAll = () => {
    const majority = formData.category;
    if (!majority || !ACADEMIC_DATA[majority]) return;

    const currentMajorPrograms = ACADEMIC_DATA[majority];
    const allSelected = currentMajorPrograms.every((p) =>
      allowedPrograms.includes(p)
    );

    if (allSelected) {
      setAllowedPrograms((prev) =>
        prev.filter((p) => !currentMajorPrograms.includes(p))
      );
    } else {
      setAllowedPrograms((prev) =>
        Array.from(new Set([...prev, ...currentMajorPrograms]))
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        // Compress & crop course cover (16:10 aspect ratio), maximum 800x500 pixels, quality 0.8
        const compressed = await compressAndResizeImage(file, {
          maxWidth: 800,
          maxHeight: 500,
          aspectRatio: 1.6,
          quality: 0.8
        });
        setSelectedFile(compressed);
        setPreviewImage(URL.createObjectURL(compressed));
      } catch (err: any) {
        console.error("Failed to compress course image:", err.message);
        toast.error("Failed to process image. Using original file.", { id: "course-image-warning" });
        setSelectedFile(file);
        setPreviewImage(URL.createObjectURL(file));
      }
    }
  };

  const handleCertFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const isHorizontal = systemLayout === "HORIZONTAL";
        // Compress & crop certificate template (A4 standard: 1.414 for Landscape, 0.707 for Portrait)
        const compressed = await compressAndResizeImage(file, {
          maxWidth: isHorizontal ? 1920 : 1358,
          maxHeight: isHorizontal ? 1358 : 1920,
          aspectRatio: isHorizontal ? 1.414 : 0.707,
          quality: 0.9 // Higher quality for certificates
        });
        setSelectedCertFile(compressed);
        setCertPreview(URL.createObjectURL(compressed));
      } catch (err: any) {
        console.error("Failed to compress certificate template:", err.message);
        toast.error("Failed to process template. Using original file.", { id: "cert-image-warning" });
        setSelectedCertFile(file);
        setCertPreview(URL.createObjectURL(file));
      }
    }
  };

  const handlePreviewCertificate = async () => {
    setCertPreviewLoading(true);
    setCertPreviewModalOpen(true);
    try {
      // Securely fetch layout preview image as a blob to attach Auth Headers
      const res = await api.get(`/lms/courses/${courseId}/certificate-preview`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      setCertPreviewUrl(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load layout preview");
      setCertPreviewModalOpen(false);
    } finally {
      setCertPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("categoryId", formData.category);
      data.append("allowedPrograms", JSON.stringify(allowedPrograms));

      if (selectedFile) {
        data.append("thumbnail", selectedFile);
      }

      if (selectedCertFile) {
        data.append("certificateTemplate", selectedCertFile);
      }

      await api.put(`/lms/courses/${courseId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Identity Updated Successfully");
      fetchCourse();
    } catch (err) {
      console.error(err);
      toast.error("Network sync protocol failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CyberpunkLoader text="Preparing Course Data..." />;

  const currentPrograms = formData.category
    ? ACADEMIC_DATA[formData.category]
    : [];

  return (
    <>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 border-b border-white/5 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Course <span className="text-neon-purple">Settings</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-4">
            Course Info & Certificate Template Settings
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="group relative flex items-center gap-3 bg-neon-purple text-white px-10 py-5 rounded-3xl font-bold uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(176,38,255,0.2)] hover:shadow-[0_0_50px_rgba(176,38,255,0.4)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save size={18} className="group-hover:animate-float" />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-4">
            <label className="text-neon-blue text-[10px] uppercase font-bold tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />{" "}
              Course Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white text-lg font-bold focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
              placeholder="e.g. Introduction to Advanced Cryptography"
            />
          </div>

          <div className="space-y-4">
            <label className="text-neon-purple text-[10px] uppercase font-bold tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" />{" "}
              Course Description
            </label>
            <div className="glass-panel rounded-2xl overflow-hidden focus-within:border-neon-purple/50 transition-all border border-white/5 shadow-inner">
              <RichTextEditor
                value={formData.description}
                onChange={(val: string) =>
                  setFormData({ ...formData, description: val })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            <div className="space-y-4">
              <label className="text-neon-soft-blue text-[10px] uppercase font-bold tracking-widest flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-soft-blue animate-pulse" />{" "}
                Course Department / Category
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleMajorityChange}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-white text-md font-bold focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.05] transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-dark-bg">
                    -- Select Course Department --
                  </option>
                  {MAJORITIES.map((m) => (
                    <option key={m} value={m} className="bg-dark-bg">
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {formData.category && currentPrograms && (
              <div className="space-y-8 glass-panel p-10 rounded-[2.5rem] border-transparent shadow-2xl animate-in fade-in duration-700">
                <div className="flex items-center justify-between gap-6 pb-6 border-b border-white/5">
                  <label className="text-neon-pink text-[10px] uppercase font-bold tracking-widest">
                    Allowed Study Programs
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[9px] uppercase font-bold text-white/60 hover:text-white transition-colors tracking-widest bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10 hover:border-white/20"
                  >
                    {currentPrograms.every((p) => allowedPrograms.includes(p))
                      ? "Clear All Selections"
                      : "Allow All Programs"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {currentPrograms.map((program) => {
                    const isSelected = allowedPrograms.includes(program);
                    return (
                      <div
                        key={program}
                        onClick={() => handleProgramToggle(program)}
                        className={`group cursor-pointer flex items-center gap-5 p-6 rounded-2xl border transition-all duration-300 ${
                          isSelected
                            ? "bg-neon-purple/10 border-neon-purple/40 shadow-[0_0_20px_rgba(176,38,255,0.1)]"
                            : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(176,38,255,0.3)]"
                              : "border border-white/10 group-hover:border-white/30"
                          }`}
                        >
                          {isSelected && <CheckSquare size={18} />}
                        </div>
                        <span
                          className={`text-sm font-semibold tracking-tight transition-colors ${
                            isSelected
                              ? "text-white"
                              : "text-white/30 group-hover:text-white/60"
                          }`}
                        >
                          {program}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-10 animate-in slide-in-from-right-6 duration-1000">
          
          {/* Banner Upload */}
          <div className="space-y-4">
            <label className="text-neon-blue text-[10px] uppercase font-bold tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />{" "}
              Course Cover Image
            </label>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-purple to-neon-blue rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative w-full aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden shadow-2xl backdrop-blur-3xl group-hover:border-white/20 transition-all duration-700">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    unoptimized={true}
                  />
                ) : (
                  <div className="text-white/5 flex flex-col items-center group-hover:text-white/10 transition-colors">
                    <ImageIcon size={72} className="mb-6" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.4em]">
                      No Image Uploaded
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-dark-bg/85 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-xl">
                  <label className="cursor-pointer px-10 py-5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-[1.5rem] hover:bg-neon-purple hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
                    <Upload size={20} className="inline mr-3" /> Upload Course Image
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Custom Template Upload */}
          <div className="space-y-4">
            <label className="text-neon-pink text-[10px] uppercase font-bold tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-pink animate-pulse" />{" "}
              Certificate Template
            </label>
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-pink to-neon-purple rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative w-full aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden shadow-2xl backdrop-blur-3xl group-hover:border-white/20 transition-all duration-700">
                {certPreview ? (
                  <Image
                    src={certPreview}
                    alt="Certificate Template"
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    unoptimized={true}
                  />
                ) : (
                  <div className="text-white/5 flex flex-col items-center group-hover:text-white/10 transition-colors">
                    <ImageIcon size={72} className="mb-6" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-center px-4">
                      Upload Custom Certificate Background
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-dark-bg/85 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col gap-4 items-center justify-center backdrop-blur-xl">
                  <label className="cursor-pointer px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-[1.5rem] hover:bg-neon-pink hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
                    <Upload size={18} className="inline mr-2" /> Upload Background Template
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCertFileChange}
                    />
                  </label>
                  {certPreview && (
                    <button
                      type="button"
                      onClick={handlePreviewCertificate}
                      className="px-8 py-4 bg-neon-pink text-white text-xs font-bold uppercase tracking-widest rounded-[1.5rem] hover:bg-white hover:text-black transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
                    >
                      Preview Custom Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
            {!certPreview && (
              <button
                type="button"
                onClick={handlePreviewCertificate}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[1.5rem] text-xs font-bold uppercase tracking-widest transition-all"
              >
                Preview Default Certificate
              </button>
            )}
          </div>

          {/* Visual Guidelines */}
          <div className="p-8 glass-panel rounded-3xl border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ImageIcon size={80} />
            </div>
            <p className="text-[10px] text-white/20 leading-relaxed font-bold uppercase tracking-widest space-y-4">
              <span className="text-neon-blue opacity-100 font-extrabold pb-4 block border-b border-white/5 mb-4">
                Certificate Upload Guide
              </span>
              <span className="flex justify-between">
                Paper Size:{" "}
                <span className="text-white/60">A4 Standard</span>
              </span>
              <span className="flex justify-between">
                Supported File Types:{" "}
                <span className="text-white/60">JPG, PNG, WEBP</span>
              </span>
              <span className="flex justify-between">
                Maximum File Size:{" "}
                <span className="text-white/60">5MB</span>
              </span>
            </p>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <span className="text-neon-pink text-[10px] font-extrabold uppercase tracking-widest block mb-2">
                Download Layout Guides
              </span>
              {systemLayout === "HORIZONTAL" ? (
                <a
                  href={`${API_BASE}/api/lms/templates/guide/HORIZONTAL`}
                  target="_blank"
                  download="blueprint-horizontal.png"
                  className="block text-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-all"
                >
                  Download Landscape (Horizontal) Guide
                </a>
              ) : (
                <a
                  href={`${API_BASE}/api/lms/templates/guide/VERTICAL`}
                  target="_blank"
                  download="blueprint-vertical.png"
                  className="block text-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-all"
                >
                  Download Portrait (Vertical) Guide
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>

      {/* Certificate Preview Modal */}
      {certPreviewModalOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0f0b29] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                Certificate Preview Example
              </h3>
              <button
                onClick={() => {
                  if (certPreviewUrl) URL.revokeObjectURL(certPreviewUrl);
                  setCertPreviewUrl(null);
                  setCertPreviewModalOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-black/45">
              {certPreviewLoading ? (
                <div className="text-teal-400 animate-pulse font-mono text-xs">
                  LOADING CERTIFICATE PREVIEW...
                </div>
              ) : certPreviewUrl ? (
                <div className="relative w-full aspect-[1.78/1] max-h-[60vh] border border-white/10 rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
                  <Image
                    src={certPreviewUrl}
                    alt="Certificate Template Preview"
                    fill
                    className="object-contain"
                    unoptimized={true}
                  />
                </div>
              ) : (
                <div className="text-rose-400 text-xs font-semibold">
                  Failed to render preview.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 flex justify-end">
              <button
                onClick={() => {
                  if (certPreviewUrl) URL.revokeObjectURL(certPreviewUrl);
                  setCertPreviewUrl(null);
                  setCertPreviewModalOpen(false);
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
