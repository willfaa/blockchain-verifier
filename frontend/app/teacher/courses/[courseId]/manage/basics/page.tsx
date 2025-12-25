"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Save, Upload, ImageIcon, CheckSquare, Square } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/features/RichTextEditor";
import { useParams } from "next/navigation";
import { ACADEMIC_DATA, MAJORITIES } from "@/lib/constants/academics";

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

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchCourse = () => {
    setLoading(true);
    // Use courseId
    api
      .get(`/lms/teacher/courses/${courseId}`)
      .then((res) => {
        const course = res.data.data;
        setFormData({
          title: course.title || "",
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          category: course.category || "",
        });

        // Handle allowedPrograms
        // Backend returns array usually.
        if (Array.isArray(course.allowedPrograms)) {
          setAllowedPrograms(course.allowedPrograms);
        } else if (typeof course.allowedPrograms === "string") {
          // Just in case
          try {
            setAllowedPrograms(JSON.parse(course.allowedPrograms));
          } catch (e) {
            setAllowedPrograms([]);
          }
        }

        if (course.thumbnail) {
          // Check if full URL or relative path
          setPreviewImage(
            course.thumbnail.startsWith("http")
              ? course.thumbnail
              : `http://localhost:4000${course.thumbnail}`
          );
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMajorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const majority = e.target.value;
    setFormData({ ...formData, category: majority });
    // Refactor: Do NOT reset allowedPrograms. Allow multi-majority selection.
  };

  const handleProgramToggle = (program: string) => {
    setAllowedPrograms((prev) => {
      if (prev.includes(program)) {
        return prev.filter((p) => p !== program);
      } else {
        return [...prev, program];
      }
    });
  };

  const handleSelectAll = () => {
    const majority = formData.category;
    if (!majority || !ACADEMIC_DATA[majority]) return;

    const currentMajorPrograms = ACADEMIC_DATA[majority];

    // Check if ALL programs from THIS majority are currently selected
    const allSelected = currentMajorPrograms.every((p) =>
      allowedPrograms.includes(p)
    );

    if (allSelected) {
      // DESELECT ALL (Remove only current major's programs, keep others)
      setAllowedPrograms((prev) =>
        prev.filter((p) => !currentMajorPrograms.includes(p))
      );
    } else {
      // SELECT ALL (Add current major's programs, avoiding duplicates)
      setAllowedPrograms((prev) => {
        const newSet = new Set([...prev, ...currentMajorPrograms]);
        return Array.from(newSet);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("allowedPrograms", JSON.stringify(allowedPrograms));
    // CRITICAL: Send courseId for folder organization in backend
    data.append("courseId", courseId);

    if (selectedFile) {
      data.append("thumbnail", selectedFile);
    }

    api
      .put(`/lms/courses/${courseId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        toast.success("Changes Saved!");
        fetchCourse(); // Refresh data/thumbnail path
      })
      .catch((err) => toast.error("Failed to save changes"))
      .finally(() => setSaving(false));
  };

  if (loading)
    return (
      <div className="text-teal-400 font-mono animate-pulse">
        Loading_Course_Data...
      </div>
    );

  const currentPrograms = formData.category
    ? ACADEMIC_DATA[formData.category]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-900/30 pb-4">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Basic_Information
        </h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-black font-bold uppercase tracking-wider text-xs rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save size={16} /> Save_Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <label className="text-teal-500 text-xs uppercase font-bold tracking-wider">
              Course Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-[#050510] border border-teal-900/50 rounded p-3 text-teal-100 focus:outline-none focus:border-teal-500/50 transition-colors placeholder:text-teal-900/40"
              placeholder="e.g. Advanced Blockchain Architecture"
            />
          </div>

          <div className="space-y-1">
            <label className="text-teal-500 text-xs uppercase font-bold tracking-wider">
              Description (Rich Text)
            </label>
            <div className="bg-[#050510] border border-teal-900/50 rounded overflow-hidden">
              <RichTextEditor
                value={formData.description}
                onChange={(val: string) =>
                  setFormData({ ...formData, description: val })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Majority Selection */}
            <div className="space-y-1">
              <label className="text-teal-500 text-xs uppercase font-bold tracking-wider">
                Majority (Faculty)
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleMajorityChange}
                className="w-full bg-[#050510] border border-teal-900/50 rounded p-3 text-teal-100 focus:outline-none focus:border-teal-500/50 transition-colors"
              >
                <option value="">-- Select Majority --</option>
                {MAJORITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Study Program Multi-Select (Conditional) */}
            {formData.category && currentPrograms && (
              <div className="space-y-3 bg-teal-900/10 p-4 rounded-lg border border-teal-900/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-cyan-400 text-xs uppercase font-bold tracking-wider">
                    Allowed Study Programs
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] uppercase font-bold text-teal-500 hover:text-white transition-colors"
                  >
                    {currentPrograms.every((p) => allowedPrograms.includes(p))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPrograms.map((program) => {
                    const isSelected = allowedPrograms.includes(program);
                    return (
                      <div
                        key={program}
                        onClick={() => handleProgramToggle(program)}
                        className={`cursor-pointer flex items-center gap-3 p-3 rounded border transition-all ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500/50"
                            : "bg-black/20 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? "bg-cyan-500 border-cyan-500 text-black"
                              : "border-slate-600"
                          }`}
                        >
                          {isSelected && (
                            <CheckSquare size={12} fill="currentColor" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            isSelected
                              ? "text-cyan-100 font-medium"
                              : "text-slate-400"
                          }`}
                        >
                          {program}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-teal-500/40 mt-1">
                  Students from these programs will be able to enroll
                  automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Thumbnail */}
        <div className="space-y-4">
          <label className="text-teal-500 text-xs uppercase font-bold tracking-wider">
            Thumbnail
          </label>
          <div className="relative group">
            <div className="w-full aspect-video bg-[#050510] border-2 border-dashed border-teal-900/50 rounded-lg flex flex-col items-center justify-center overflow-hidden">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              ) : (
                <div className="text-teal-500/30 flex flex-col items-center">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-xs uppercase">No Image</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer px-4 py-2 bg-teal-500/20 border border-teal-500 text-teal-400 text-xs font-bold uppercase rounded hover:bg-teal-500 hover:text-black transition-colors">
                  <Upload size={14} className="inline mr-2" /> Change
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
            <p className="text-[10px] text-teal-500/50 mt-2 text-center">
              Recommended: 1280x720 (16:9). JPG or PNG.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
