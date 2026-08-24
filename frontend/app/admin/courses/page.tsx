"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { BookOpen, Edit2, Trash2, Upload, ImageIcon, RefreshCw, X, CheckSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "@/lib/utils";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Departments list for dynamic cascading selects / checkboxes
  const [departments, setDepartments] = useState<any[]>([]);

  // Edit Course Modal State
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
  });
  const [allowedPrograms, setAllowedPrograms] = useState<string[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [certTemplateFile, setCertTemplateFile] = useState<File | null>(null);
  
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [certTemplatePreview, setCertTemplatePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/courses");
      if (res.data.ok) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load all courses list");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/lms/departments");
      if (res.data.ok) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? This will remove all modules, lessons, assignments, and student enrollments for this course.")) return;

    try {
      const res = await api.delete(`/admin/courses/${id}`);
      if (res.data.ok) {
        toast.success("Course deleted successfully");
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete course");
    }
  };

  const handleOpenEdit = (course: any) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      categoryId: course.categoryId || "",
    });

    // Allowed programs parsing
    let programs: string[] = [];
    if (Array.isArray(course.allowedPrograms)) {
      programs = course.allowedPrograms;
    } else if (typeof course.allowedPrograms === "string") {
      try {
        programs = JSON.parse(course.allowedPrograms);
      } catch (e) {
        programs = [];
      }
    }
    setAllowedPrograms(programs);

    setThumbnailFile(null);
    setCertTemplateFile(null);
    setThumbnailPreview(course.imageUrl ? getAssetUrl(course.imageUrl) : null);
    setCertTemplatePreview(course.certificateTemplate ? getAssetUrl(course.certificateTemplate) : null);
  };

  const handleProgramToggle = (programName: string) => {
    setAllowedPrograms((prev) =>
      prev.includes(programName)
        ? prev.filter((p) => p !== programName)
        : [...prev, programName]
    );
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCertTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCertTemplateFile(file);
      setCertTemplatePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("categoryId", formData.categoryId);
    data.append("allowedPrograms", JSON.stringify(allowedPrograms));

    if (thumbnailFile) {
      data.append("thumbnail", thumbnailFile);
    }
    if (certTemplateFile) {
      data.append("certificateTemplate", certTemplateFile);
    }

    try {
      const res = await api.put(`/admin/courses/${selectedCourse.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.ok) {
        toast.success("Course modified successfully");
        setSelectedCourse(null);
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update course settings");
    } finally {
      setSaving(false);
    }
  };

  // Get all unique concentrations flat list for program checkbox select
  const allConcentrations = departments.flatMap((dept) =>
    dept.programKeahlian.flatMap((prog: any) =>
      prog.konsentrasiKeahlian.map((conc: any) => conc.name)
    )
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            System <span className="text-neon-purple">Courses</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-4">
            Administrative full access to all deployed courses & custom templates
          </p>
        </div>
        <button
          onClick={fetchCourses}
          className="p-4 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all"
          title="Refresh Courses List"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="text-teal-500 animate-pulse font-mono flex items-center gap-2">
          <span>&gt;</span> ACCESSING_COURSES_REGISTRY...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {courses.map((course) => {
            const thumbnailSrc = course.imageUrl ? getAssetUrl(course.imageUrl) : null;
            return (
              <div
                key={course.id}
                className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-white/10 transition-all duration-300 shadow-xl flex flex-col md:flex-row gap-6"
              >
                {/* Course Image */}
                <div className="relative w-full md:w-44 aspect-video md:aspect-square bg-slate-950 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                      <ImageIcon size={36} />
                      <span className="text-[8px] uppercase tracking-widest mt-2">No Cover</span>
                    </div>
                  )}
                </div>

                {/* Course Metadata */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-neon-purple transition-colors leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-white/40 font-semibold mt-1">
                      Teacher: <span className="text-white/60">{course.user?.name || "System"}</span>
                    </p>
                    {course.certificateTemplate ? (
                      <span className="inline-block mt-3 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] font-bold uppercase tracking-widest rounded-full">
                        Custom Certificate Background
                      </span>
                    ) : (
                      <span className="inline-block mt-3 px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-bold uppercase tracking-widest rounded-full">
                        Default System Certificate
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-3 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Course Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-start justify-center pt-24 p-6 z-50 overflow-y-auto animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative mb-10 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-white mb-8">
              Edit Course Settings & Overrides
            </h3>

            <form onSubmit={handleUpdateSubmit} className="space-y-8">
              {/* Basics info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400">
                    Course Title
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400">
                    Course Department / Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-blue/50 transition-all cursor-pointer text-sm"
                  >
                    <option value="" className="bg-slate-900">-- None --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name} className="bg-slate-900">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                  Course Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                />
              </div>

              {/* Upload Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Thumbnail upload */}
                <div className="space-y-3">
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400">
                    Course Thumbnail Cover
                  </label>
                  <div className="relative w-full aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-white/20 transition-all">
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white/10 flex flex-col items-center">
                        <ImageIcon size={36} />
                        <span className="text-[9px] uppercase font-bold tracking-widest mt-2">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-5 py-3 bg-white text-black hover:bg-neon-blue hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
                        Change Cover
                        <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailChange} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Specific Certificate template upload */}
                <div className="space-y-3">
                  <label className="block text-xs uppercase font-bold tracking-widest text-neon-pink">
                    Course Certificate Background Override
                  </label>
                  <div className="relative w-full aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-white/20 transition-all">
                    {certTemplatePreview ? (
                      <img src={certTemplatePreview} alt="Cert Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white/10 flex flex-col items-center p-4 text-center">
                        <ImageIcon size={36} />
                        <span className="text-[9px] uppercase font-bold tracking-widest mt-2">Using Global Default Background</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="cursor-pointer px-5 py-3 bg-white text-black hover:bg-neon-pink hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
                        Upload Override Template
                        <input type="file" className="hidden" accept="image/*" onChange={handleCertTemplateChange} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic allowed study programs selector */}
              {allConcentrations.length > 0 && (
                <div className="space-y-4 border-t border-white/5 pt-6">
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400">
                    Allowed Konsentrasi Keahlian (Student Enrollments)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[180px] overflow-y-auto pr-2">
                    {allConcentrations.map((conc) => {
                      const isSelected = allowedPrograms.includes(conc);
                      return (
                        <div
                          key={conc}
                          onClick={() => handleProgramToggle(conc)}
                          className={`cursor-pointer flex items-center gap-4 p-4 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-neon-purple/10 border-neon-purple/40"
                              : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                            isSelected ? "bg-neon-purple text-white border-neon-purple" : "border-white/20"
                          }`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </div>
                          <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-white/40"}`}>
                            {conc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="flex-1 py-4 border border-white/10 text-white hover:bg-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 bg-neon-purple hover:shadow-[0_0_20px_rgba(176,38,255,0.3)] text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  {saving ? "Saving settings..." : "Save Course Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
