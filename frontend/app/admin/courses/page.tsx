"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import {
  BookOpen,
  Edit2,
  Trash2,
  Upload,
  ImageIcon,
  RefreshCw,
  X,
  CheckSquare,
  Plus,
  Search,
  Filter,
  GraduationCap,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "@/lib/utils";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "title" | "teacher">("newest");

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
    if (
      !confirm(
        "Are you sure you want to delete this course? This will remove all modules, lessons, assignments, and student enrollments for this course."
      )
    )
      return;

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

  // Unique categories / departments from courses
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach((c) => {
      if (c.category?.name) cats.add(c.category.name);
      else if (c.categoryName) cats.add(c.categoryName);
      else if (c.categoryId) cats.add(c.categoryId);
    });
    return Array.from(cats);
  }, [courses]);

  // Filter and Sort Courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        // Category Filter
        if (selectedCategory !== "ALL") {
          const catName = course.category?.name || course.categoryName || course.categoryId || "";
          if (catName !== selectedCategory) return false;
        }

        // Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const title = (course.title || "").toLowerCase();
        const desc = (course.description || "").toLowerCase();
        const teacherName = (course.user?.name || "").toLowerCase();
        const catName = (course.category?.name || course.categoryName || "").toLowerCase();
        const schoolName = (course.schoolName || "").toLowerCase();

        return (
          title.includes(q) ||
          desc.includes(q) ||
          teacherName.includes(q) ||
          catName.includes(q) ||
          schoolName.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        } else if (sortBy === "teacher") {
          return (a.user?.name || "").localeCompare(b.user?.name || "");
        }
        // Default newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [courses, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                All <span className="text-cyan-400">Courses & Programs</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Akses manajemen penuh seluruh kursus, skema sertifikasi kejuruan, dan template sertifikat.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchCourses}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white rounded-xl text-xs font-bold border border-cyan-500/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Kursus / Skema</p>
          <p className="text-2xl font-black text-white font-mono">{courses.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Kategori / Jurusan</p>
          <p className="text-2xl font-black text-cyan-300 font-mono">{categoriesList.length || departments.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/30 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider">Template Kustom</p>
          <p className="text-2xl font-black text-fuchsia-300 font-mono">
            {courses.filter((c) => c.certificateTemplate).length}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Hasil Terfilter</p>
          <p className="text-2xl font-black text-emerald-300 font-mono">{filteredCourses.length}</p>
        </div>
      </div>

      {/* Cyberpunk Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari Judul Kursus, Instruktur, Kategori, Program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Filter size={14} className="text-cyan-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">Semua Kategori</option>
              {categoriesList.map((cat, idx) => (
                <option key={idx} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <span className="text-slate-500 font-bold">Urut:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="newest" className="bg-slate-900 text-white">Terbaru</option>
              <option value="title" className="bg-slate-900 text-white">Judul A-Z</option>
              <option value="teacher" className="bg-slate-900 text-white">Nama Guru</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-cyan-400 animate-pulse font-mono flex items-center justify-center p-12 text-xs">
          <span>&gt; ACCESSING_COURSES_REGISTRY...</span>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-slate-900/40 text-slate-400 space-y-2">
          <BookOpen size={36} className="mx-auto text-slate-600" />
          <p className="text-sm font-bold text-white">Tidak ada kursus yang sesuai dengan kriteria pencarian.</p>
          <p className="text-xs">Coba ubah kata kunci atau reset filter kategori.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => {
            const thumbnailSrc = course.imageUrl ? getAssetUrl(course.imageUrl) : null;
            return (
              <div
                key={course.id}
                className="group relative p-6 bg-slate-900/60 border border-white/10 rounded-3xl hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col sm:flex-row gap-6 backdrop-blur-xl"
              >
                {/* Course Image */}
                <div className="relative w-full sm:w-44 aspect-video sm:aspect-square bg-slate-950 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <ImageIcon size={32} />
                      <span className="text-[9px] uppercase tracking-widest mt-2 font-mono">No Cover</span>
                    </div>
                  )}
                </div>

                {/* Course Metadata */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono uppercase">
                        {course.category?.name || course.categoryName || "Umum"}
                      </span>
                      {course.certificateTemplate && (
                        <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-bold font-mono uppercase">
                          Custom Cert
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Users size={13} className="text-slate-500" />
                      <span>Instruktur:</span>
                      <span className="text-white font-medium">{course.user?.name || "Administrator"}</span>
                    </p>
                    {course.schoolName && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {course.schoolName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Edit2 size={13} />
                      <span>Edit Kursus</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl transition-all"
                      title="Hapus Kursus"
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-start justify-center pt-16 p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative mb-10 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Edit2 size={18} className="text-cyan-400" />
              <span>Edit Pengaturan & Template Kursus</span>
            </h3>

            <form onSubmit={handleUpdateSubmit} className="space-y-6 text-xs">
              {/* Basics info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block uppercase font-bold tracking-wider text-slate-300 text-[11px]">
                    Judul Kursus / Skema Sertifikasi
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block uppercase font-bold tracking-wider text-slate-300 text-[11px]">
                    Kategori / Konsentrasi Keahlian
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  >
                    <option value="">-- Pilih Kategori / Keahlian --</option>
                    {departments.map((dept) =>
                      dept.programKeahlian.map((prog: any) =>
                        prog.konsentrasiKeahlian.map((conc: any) => (
                          <option key={conc.id} value={conc.id}>
                            {dept.name} &gt; {prog.name} &gt; {conc.name}
                          </option>
                        ))
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block uppercase font-bold tracking-wider text-slate-300 text-[11px]">
                    Deskripsi Kursus
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3.5 text-white focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <label className="block uppercase font-bold tracking-wider text-slate-300 text-[11px]">
                    Cover Thumbnail Kursus
                  </label>
                  <label className="border-2 border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl p-4 bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer text-center group transition-all">
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                    <Upload size={20} className="text-slate-400 group-hover:text-cyan-400 mb-1" />
                    <span className="text-[11px] font-bold text-white">
                      {thumbnailFile ? thumbnailFile.name : "Unggah Cover Baru"}
                    </span>
                  </label>
                  {thumbnailPreview && (
                    <img src={thumbnailPreview} alt="Cover Preview" className="h-24 w-auto rounded-lg object-cover border border-white/10" />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block uppercase font-bold tracking-wider text-slate-300 text-[11px]">
                    Background Template Sertifikat (Opsional)
                  </label>
                  <label className="border-2 border-dashed border-white/10 hover:border-fuchsia-500/50 rounded-2xl p-4 bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer text-center group transition-all">
                    <input type="file" accept="image/*" onChange={handleCertTemplateChange} className="hidden" />
                    <Upload size={20} className="text-slate-400 group-hover:text-fuchsia-400 mb-1" />
                    <span className="text-[11px] font-bold text-white">
                      {certTemplateFile ? certTemplateFile.name : "Unggah Template Khusus"}
                    </span>
                  </label>
                  {certTemplatePreview && (
                    <img src={certTemplatePreview} alt="Template Preview" className="h-24 w-auto rounded-lg object-cover border border-white/10" />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
