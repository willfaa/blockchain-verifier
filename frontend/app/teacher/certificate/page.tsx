// frontend/app/teacher/certificate/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Award,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Hash,
  BookOpen,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarUrl } from "@/lib/utils";
import CertificateTemplate from "@/components/features/CertificateTemplate";
import CertificateTranscriptPage, { CompetencyItem } from "@/components/features/CertificateTranscriptPage";

export default function SmartIssueCertificatePage() {
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<"front" | "transcript">("front");
  const [previewZoom, setPreviewZoom] = useState<number>(55);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(70);

  // Search State
  const [searchStudentId, setSearchStudentId] = useState("");
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Course State
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Multi-Page & Transcript Details State
  const [pageMode, setPageMode] = useState<"SINGLE" | "DOUBLE">("DOUBLE");
  const [competencyUnits, setCompetencyUnits] = useState<CompetencyItem[]>([]);
  const [birthPlaceDate, setBirthPlaceDate] = useState("");
  const [schoolOrigin, setSchoolOrigin] = useState("");
  const [examinerName, setExaminerName] = useState("");
  const [examinerNip, setExaminerNip] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");

  // Admin / Public LMS Layout Settings State
  const [layoutSettings, setLayoutSettings] = useState<any>({});

  // 1. Fetch Teacher's Courses and LMS Layout Settings on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [coursesRes, settingsRes] = await Promise.allSettled([
          api.get("/lms/teacher/my-courses"),
          api.get("/lms/settings"),
        ]);

        if (coursesRes.status === "fulfilled" && coursesRes.value?.data?.ok) {
          setCourses(coursesRes.value.data.data || []);
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value?.data?.settings) {
          const s = settingsRes.value.data.settings;
          setLayoutSettings(s);

          // Set default examiner from instructors or instructorName
          if (Array.isArray(s.instructors) && s.instructors.length > 0) {
            setExaminerName((prev) => prev || s.instructors[0].name);
            setExaminerNip((prev) => prev || s.instructors[0].nip);
          } else {
            if (s.instructorName) setExaminerName((prev) => prev || s.instructorName);
            if (s.instructorNip) setExaminerNip((prev) => prev || s.instructorNip);
          }

          if (s.schoolName) {
            setSchoolOrigin((prev) => prev || s.schoolName);
          }
        }
      } catch (err) {
        console.error("Failed to initialize teacher issuance data:", err);
      }
    };
    initData();
  }, []);

  // 2. Fetch Course Competency Units when Course Selection Changes
  useEffect(() => {
    if (!courseId) {
      setSelectedCourse(null);
      setCompetencyUnits([]);
      return;
    }

    const matched = courses.find((c) => c.id === courseId);
    setSelectedCourse(matched || null);

    if (matched?.schoolName && !schoolOrigin) {
      setSchoolOrigin(matched.schoolName);
    }

    setLoadingUnits(true);
    api
      .get(`/lms/courses/${courseId}/competency-units`)
      .then((res) => {
        if (res.data.ok && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const formatted = res.data.data.map((u: any, idx: number) => ({
            code: u.code || `UNIT-${idx + 1}`,
            title: u.title || `Unit Kompetensi ${idx + 1}`,
            standard: u.standard || "SKKNI",
            score: u.score !== undefined && u.score !== null ? String(u.score) : "90.00",
            result: u.result || "KOMPETEN",
          }));
          setCompetencyUnits(formatted);
        } else {
          // Provide standard initial vocational units if course has none yet
          setCompetencyUnits([
            { code: "J.620100.004.01", title: "Memahami dasar pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.009.02", title: "Memahami tipe data dan variable", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.017.02", title: "Menerapkan operator dan percabangan", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.025.02", title: "Menerapkan algoritma pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.033.02", title: "Menerapkan debugging dan error handling", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          ]);
        }
      })
      .catch(() => {
        setCompetencyUnits([
          { code: "J.620100.004.01", title: "Memahami dasar pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.009.02", title: "Memahami tipe data dan variable", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.017.02", title: "Menerapkan operator dan percabangan", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
        ]);
      })
      .finally(() => setLoadingUnits(false));
  }, [courseId, courses]);

  // Real-time Average Score Calculation
  const averageScore = useMemo(() => {
    if (!competencyUnits || competencyUnits.length === 0) return "0.00";
    const validScores = competencyUnits
      .map((u) => parseFloat(String(u.score || "0")))
      .filter((s) => !isNaN(s));
    if (validScores.length === 0) return "0.00";
    const sum = validScores.reduce((a, b) => a + b, 0);
    return (sum / validScores.length).toFixed(2);
  }, [competencyUnits]);

  // Handler: Cari Mahasiswa
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchStudentId.trim();
    if (!cleanId) return;

    setLoadingSearch(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      const res = await api.get(`/auth/student/${encodeURIComponent(cleanId)}`);
      if (res.data.ok && res.data.student) {
        const student = res.data.student;
        setFoundStudent(student);
        if (student.schoolOrigin && !schoolOrigin) {
          setSchoolOrigin(student.schoolOrigin);
        }
        if (student.birthPlaceDate && !birthPlaceDate) {
          setBirthPlaceDate(student.birthPlaceDate);
        }
      } else {
        setSearchError("Data siswa tidak ditemukan di database.");
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.error || "Siswa tidak ditemukan dalam registri.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Competency Table Actions
  const handleScoreChange = (index: number, val: string) => {
    const updated = [...competencyUnits];
    updated[index].score = val;
    setCompetencyUnits(updated);
  };

  const handleUnitTitleChange = (index: number, val: string) => {
    const updated = [...competencyUnits];
    updated[index].title = val;
    setCompetencyUnits(updated);
  };

  const handleUnitCodeChange = (index: number, val: string) => {
    const updated = [...competencyUnits];
    updated[index].code = val;
    setCompetencyUnits(updated);
  };

  const handleAddUnit = () => {
    setCompetencyUnits([
      ...competencyUnits,
      {
        code: `UNIT-${competencyUnits.length + 1}`,
        title: "Kompetensi Keahlian Baru",
        score: "90.00",
        standard: "SKKNI",
        result: "KOMPETEN",
      },
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    setCompetencyUnits(competencyUnits.filter((_, idx) => idx !== index));
  };

  const handleBulkFillScores = (scoreValue: string) => {
    const updated = competencyUnits.map((u) => ({
      ...u,
      score: scoreValue,
    }));
    setCompetencyUnits(updated);
    toast.success(`Seluruh nilai berhasil diset ke ${scoreValue}`);
  };

  // Handler: Open Preview Modal (With Strict Course Validation)
  const handleOpenPreview = () => {
    if (!foundStudent) {
      toast.error("Harap cari dan pilih siswa terlebih dahulu.");
      return;
    }
    if (!courseId) {
      toast.error("Harap pilih Course / Program Pelatihan terlebih dahulu.");
      return;
    }
    setPreviewTab("front");
    setShowModal(true);
  };

  // Handler: Issue & Mint Certificate to Blockchain
  const handleIssue = async () => {
    if (!foundStudent || !courseId) return;
    setLoadingIssue(true);

    try {
      const payload = {
        name: foundStudent.name,
        studentName: foundStudent.name,
        studentId: foundStudent.studentId || foundStudent.nim || foundStudent.nisn,
        program: foundStudent.studyProgram || foundStudent.program || selectedCourse?.title || "Program Keahlian",
        majority: foundStudent.majority || "Teknik Informatika",
        courseId: courseId,
        courseName: selectedCourse?.title,
        schoolName: schoolOrigin || selectedCourse?.schoolName || layoutSettings.schoolName || "SMK Mitra IDUKA",
        certificateNumber: certificateNumber.trim() || undefined,
        birthPlaceDate: birthPlaceDate.trim() || undefined,
        schoolOrigin: schoolOrigin.trim() || undefined,
        layoutMode: pageMode === "DOUBLE" ? "DUPLEX_2_PAGES" : "STANDARD",
        competencyUnits: competencyUnits.map((u) => ({
          code: u.code,
          title: u.title,
          standard: u.standard || "SKKNI",
          score: u.score || "90.00",
          result: u.result || "KOMPETEN",
        })),
        averageScore: averageScore,
        signers:
          Array.isArray(layoutSettings.instructors) && layoutSettings.instructors.length > 0
            ? layoutSettings.instructors.map((inst: any, idx: number) => ({
                name: (idx === 0 && examinerName) ? examinerName : inst.name,
                title: inst.title || (idx === 0 ? "Penguji / Asesor Uji Kompetensi Keahlian" : "Mitra Industri"),
                nip: (idx === 0 && examinerNip) ? examinerNip : (inst.nip || "-"),
                role: idx === 0 ? "PENGUJI" : "MITRA",
                signatureUrl: inst.signatureUrl || undefined,
              }))
            : [
                {
                  name: examinerName || layoutSettings.instructorName || "Kepala Sekolah",
                  title: "Penguji / Asesor Uji Kompetensi Keahlian",
                  nip: examinerNip || layoutSettings.instructorNip || "-",
                  role: "PENGUJI",
                },
              ],
      };

      const res = await api.post("/certificates/issue", payload);

      if (res.data.ok) {
        toast.success("Certificate Issued & Minted Successfully! ⚡", {
          description: `Cert ID: ${res.data.certId || "SUCCESS"} | Mode: ${pageMode === "DOUBLE" ? "2 Halaman (Duplex)" : "1 Halaman"}`,
        });

        // Reset Form
        setFoundStudent(null);
        setSearchStudentId("");
        setCourseId("");
        setShowModal(false);
      } else {
        throw new Error(res.data.error || "Gagal menerbitkan sertifikat");
      }
    } catch (err: any) {
      toast.error("Penerbitan Gagal: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingIssue(false);
    }
  };

  const isFormValid = Boolean(foundStudent && courseId);

  // Canvas & Paper Dimension Computations for Modal Preview
  const dpi = 150;
  const cmToPx = dpi / 2.54;
  const rawPaperSize = (layoutSettings.certificatePaperSize || "A4").toUpperCase();
  const defaultPreset =
    rawPaperSize === "F4"
      ? { width: 33.0, height: 21.5 }
      : rawPaperSize === "LETTER"
      ? { width: 27.94, height: 21.59 }
      : { width: 29.7, height: 21.0 };
  const rawW = layoutSettings.paperWidthCm || defaultPreset.width;
  const rawH = layoutSettings.paperHeightCm || defaultPreset.height;
  const isVertical = (layoutSettings.certificateLayout || "HORIZONTAL") === "VERTICAL";
  const paperWidthCm = isVertical ? Math.min(rawW, rawH) : Math.max(rawW, rawH);
  const paperHeightCm = isVertical ? Math.max(rawW, rawH) : Math.min(rawW, rawH);
  const canvasPxW = Math.round(paperWidthCm * cmToPx);
  const canvasPxH = Math.round(paperHeightCm * cmToPx);

  const scaledW = Math.round((canvasPxW * previewZoom) / 100);
  const scaledH = Math.round((canvasPxH * previewZoom) / 100);

  const fullscreenScaledW = Math.round((canvasPxW * fullscreenZoom) / 100);
  const fullscreenScaledH = Math.round((canvasPxH * fullscreenZoom) / 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Award size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Penerbitan Sertifikat & Transkrip Kompetensi
            </h1>
            <p className="text-sm text-slate-400">
              Terbitkan sertifikat 1 Halaman atau 2 Halaman (Transkrip Nilai SKKNI) terverifikasi blockchain ledger.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: SEARCH STUDENT --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0d0b2f]/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="text-cyan-400" size={18} />
                Langkah 1: Cari Siswa (NISN / ID)
              </h3>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 ml-1">
                    Nomor Induk Siswa (NIS / NISN)
                  </label>
                  <div className="relative">
                    <input
                      value={searchStudentId}
                      onChange={(e) => setSearchStudentId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/60 pl-11 pr-4 py-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600 text-sm"
                      placeholder="Contoh: 0123456768 atau NIM..."
                      autoFocus
                    />
                    <Hash
                      className="absolute left-3.5 top-3.5 text-slate-500"
                      size={16}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingSearch || !searchStudentId.trim()}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm active:scale-98"
                >
                  {loadingSearch ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Search size={18} />
                  )}
                  {loadingSearch ? "Mencari di Database..." : "Cari Data Siswa"}
                </button>
              </form>

              {/* State Feedback */}
              <div className="pt-2">
                {searchError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start animate-in fade-in">
                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-xs font-bold text-red-400">Data Tidak Ditemukan</h4>
                      <p className="text-xs text-red-300 mt-0.5">{searchError}</p>
                    </div>
                  </div>
                )}

                {foundStudent && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-center animate-in fade-in">
                    <CheckCircle className="text-emerald-400 shrink-0" size={22} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-emerald-400">Siswa Ditemukan!</h4>
                      <p className="text-xs text-white truncate font-medium">{foundStudent.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Page Count Mode Selection Card */}
            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">
                Format Halaman Sertifikat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPageMode("SINGLE")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    pageMode === "SINGLE"
                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold">1 Halaman</span>
                  <span className="text-[10px] text-slate-400">Sertifikat Depan Saja</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPageMode("DOUBLE")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    pageMode === "DOUBLE"
                      ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-300 shadow-md shadow-fuchsia-500/10"
                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold">2 Halaman (Duplex)</span>
                  <span className="text-[10px] text-slate-400">Depan + Transkrip Nilai</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: COURSE SELECTION & INPUT DETAILS --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0d0b2f]/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl relative overflow-hidden space-y-6">
            
            {/* STEP 2: COURSE SELECTION (MANDATORY NOTICE) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-fuchsia-400" size={18} />
                  Langkah 2: Pilih Course / Skema Sertifikasi <span className="text-red-400">*</span>
                </h3>
                {courseId && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    Course Terpilih
                  </span>
                )}
              </div>

              {/* Prominent Warning if No Course is selected */}
              {!courseId && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-pulse">
                  <AlertCircle className="text-amber-400 shrink-0" size={18} />
                  <p className="text-xs font-medium text-amber-200">
                    <strong>Pemberitahuan:</strong> Harap pilih Course / Program Pelatihan terlebih dahulu agar unit kompetensi dan layout sertifikat dapat disinkronkan.
                  </p>
                </div>
              )}

              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-cyan-500 h-12">
                  <SelectValue placeholder="-- Pilih Course / Skema Keahlian --" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {courses.length > 0 ? (
                    courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id} className="cursor-pointer">
                        {course.title}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      Belum ada kursus yang dibuat oleh guru ini.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* STUDENT SNAPSHOT PREVIEW */}
            {foundStudent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={getAvatarUrl(foundStudent.avatar)} alt={foundStudent.name} />
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                      {getInitials(foundStudent.name || "Std")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Nama Penerima</p>
                    <p className="text-sm font-bold text-white truncate">{foundStudent.name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Program / Jurusan</p>
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {foundStudent.studyProgram || foundStudent.program || "Rekayasa Perangkat Lunak"}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: TRANSCRIPT COMPETENCY UNITS & SCORE TABLE (IF 2-PAGE MODE) */}
            {pageMode === "DOUBLE" && courseId && (
              <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="text-amber-400" size={18} />
                      Langkah 3: Input Nilai Unit Kompetensi (Halaman 2 Transkrip)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nilai akan dicetak di tabel transkrip dan dikunci ke hash kriptografis blockchain.
                    </p>
                  </div>

                  {/* Bulk Fill Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkFillScores("90.00")}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1"
                    >
                      <Sparkles size={13} />
                      Set Semua 90.00
                    </button>
                    <button
                      type="button"
                      onClick={handleAddUnit}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1"
                    >
                      <Plus size={13} />
                      Tambah Unit
                    </button>
                  </div>
                </div>

                {/* Table of Competencies */}
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 w-36">Kode Unit</th>
                        <th className="py-2.5 px-3">Daftar Kompetensi / Sub-Kompetensi</th>
                        <th className="py-2.5 px-3 w-28 text-center">Nilai (0-100)</th>
                        <th className="py-2.5 px-2 w-10 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {competencyUnits.map((u, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={u.code || ""}
                              onChange={(e) => handleUnitCodeChange(idx, e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                              placeholder="Kode Unit"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={u.title || ""}
                              onChange={(e) => handleUnitTitleChange(idx, e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
                              placeholder="Judul Unit Kompetensi"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={u.score || ""}
                              onChange={(e) => handleScoreChange(idx, e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold text-center focus:border-amber-400 focus:outline-none"
                              placeholder="90.00"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(idx)}
                              className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                              title="Hapus Unit"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-white/5 border-t border-white/10 font-bold">
                        <td colSpan={3} className="py-2.5 px-4 text-right text-xs uppercase tracking-wider text-slate-300">
                          NILAI RATA-RATA OTOMATIS:
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-sm font-extrabold text-amber-300">
                          {averageScore}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Additional Metadata Fields for Certificate & Transcript */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Nama Penguji / Asesor
                    </label>
                    <input
                      type="text"
                      value={examinerName}
                      onChange={(e) => setExaminerName(e.target.value)}
                      placeholder="Contoh: Sonny Michael Wijaya, S.Kom"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      NIP / No. Registrasi Asesor
                    </label>
                    <input
                      type="text"
                      value={examinerNip}
                      onChange={(e) => setExaminerNip(e.target.value)}
                      placeholder="Contoh: REG-BNSP-7782-2026"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Tempat & Tanggal Lahir Siswa
                    </label>
                    <input
                      type="text"
                      value={birthPlaceDate}
                      onChange={(e) => setBirthPlaceDate(e.target.value)}
                      placeholder="Contoh: Salatiga, 20 Januari 2002"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Sekolah Asal / Satuan Pendidikan
                    </label>
                    <input
                      type="text"
                      value={schoolOrigin}
                      onChange={(e) => setSchoolOrigin(e.target.value)}
                      placeholder="Contoh: SMK Gamelab Indonesia"
                      className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTON AREA */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {!foundStudent ? (
                  <span>⚠️ Cari siswa terlebih dahulu.</span>
                ) : !courseId ? (
                  <span className="text-amber-300 font-medium">⚠️ Pilih course untuk mengaktifkan tombol preview & issue.</span>
                ) : (
                  <span className="text-emerald-400 font-medium">✅ Siap melakukan pratinjau & penerbitan.</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenPreview}
                disabled={!isFormValid}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-fuchsia-500/20 flex items-center justify-center gap-2 transform active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                <Award size={18} />
                Pratinjau & Terbitkan Sertifikat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DUAL TAB PREVIEW & CONFIRMATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-slate-900/90">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Award size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Pratinjau Sertifikat Resmi ({pageMode === "DOUBLE" ? "2 Halaman Duplex" : "1 Halaman"})
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm ({layoutSettings.certificatePaperSize || "A4"}) · {isVertical ? "Portrait" : "Landscape"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Periksa seluruh data nama, nilai kompetensi, tanda tangan digital, dan posisi visual sebelum dicetak ke ledger blockchain.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                {/* Zoom Controls Toolbar */}
                <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(20, z - 5))}
                    className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
                    title="Perkecil (Zoom Out)"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <span className="text-xs font-mono text-white/90 w-12 text-center select-none font-semibold">
                    {previewZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(200, z + 5))}
                    className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
                    title="Perbesar (Zoom In)"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <div className="w-px h-4 bg-white/15 mx-1" />
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(55)}
                    className="px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-cyan-400 rounded transition-colors"
                    title="Reset Ukuran (Fit Screen)"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(100)}
                    className="px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-cyan-400 rounded transition-colors"
                    title="100% Ukuran Asli"
                  >
                    100%
                  </button>
                </div>

                {/* Fullscreen Modal Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setFullscreenZoom(65);
                    setIsFullscreenPreview(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
                  title="Buka Layar Penuh (Fullscreen)"
                >
                  <Maximize2 size={13} className="text-cyan-400" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </button>

                {/* Dual Tab Toggle if 2-Page Mode */}
                {pageMode === "DOUBLE" && (
                  <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("front")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === "front"
                          ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Award size={13} />
                      <span>Halaman 1 (Depan)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("transcript")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === "transcript"
                          ? "bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <FileText size={13} />
                      <span>Halaman 2 (Transkrip)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body: Vector Canvas Preview */}
            <div
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  if (e.deltaY < 0) {
                    setPreviewZoom((z) => Math.min(200, z + 5));
                  } else {
                    setPreviewZoom((z) => Math.max(20, z - 5));
                  }
                }
              }}
              className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950/95 flex flex-col items-center justify-start custom-scrollbar relative min-h-[380px] max-h-[72vh]"
            >
              {/* Scaled bounding box - strictly eliminates overflow bugs */}
              <div
                style={{
                  width: `${scaledW}px`,
                  height: `${scaledH}px`,
                  minWidth: `${scaledW}px`,
                  minHeight: `${scaledH}px`,
                  transition: "width 0.12s ease-out, height 0.12s ease-out",
                }}
                className="relative shrink-0 shadow-2xl rounded-lg overflow-hidden border border-white/10 m-auto"
              >
                <div
                  style={{
                    width: `${canvasPxW}px`,
                    height: `${canvasPxH}px`,
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: "top left",
                    transition: "transform 0.12s ease-out",
                  }}
                  className="absolute top-0 left-0 select-none pointer-events-auto"
                >
                  {previewTab === "front" ? (
                    <CertificateTemplate
                      studentName={foundStudent?.name}
                      studentId={foundStudent?.studentId || foundStudent?.nim || foundStudent?.nisn}
                      courseName={selectedCourse?.title || "Program Keahlian"}
                      program={foundStudent?.studyProgram || foundStudent?.program || selectedCourse?.title || "Program Keahlian"}
                      majority={foundStudent?.majority || "Teknik Informatika"}
                      issuedAt={new Date().toISOString()}
                      layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                      paperSize={layoutSettings.certificatePaperSize || "A4"}
                      paperWidthCm={layoutSettings.paperWidthCm || 29.7}
                      paperHeightCm={layoutSettings.paperHeightCm || 21.0}
                      instructorName={examinerName || (layoutSettings.instructors && layoutSettings.instructors[0]?.name) || layoutSettings.instructorName}
                      instructorNip={examinerNip || (layoutSettings.instructors && layoutSettings.instructors[0]?.nip) || layoutSettings.instructorNip}
                      instructors={layoutSettings.instructors}
                      institutionLogo={layoutSettings.institutionLogo}
                      institutionName={layoutSettings.institutionName}
                      institutionSubtext={layoutSettings.institutionSubtext}
                      bgPath={selectedCourse?.certificateTemplate || layoutSettings.certificateTemplate || layoutSettings.bgPath}
                      layoutConfig={layoutSettings.layoutConfig}
                    />
                  ) : (
                    <CertificateTranscriptPage
                      studentName={foundStudent?.name}
                      studentId={foundStudent?.studentId || foundStudent?.nim || foundStudent?.nisn}
                      majority={foundStudent?.majority || "Teknik Komputer dan Jaringan"}
                      program={foundStudent?.studyProgram || foundStudent?.program || selectedCourse?.title}
                      courseTitle={selectedCourse?.title}
                      units={competencyUnits}
                      averageScore={averageScore}
                      examinerName={examinerName || (layoutSettings.instructors && layoutSettings.instructors[0]?.name) || layoutSettings.instructorName || "Penguji / Asesor"}
                      examinerNip={examinerNip || (layoutSettings.instructors && layoutSettings.instructors[0]?.nip) || layoutSettings.instructorNip || "-"}
                      institutionLogo={layoutSettings.institutionLogo}
                      institutionName={layoutSettings.institutionName}
                      institutionSubtext={layoutSettings.institutionSubtext}
                      schoolName={layoutSettings.institutionName || schoolOrigin || selectedCourse?.schoolName || layoutSettings.schoolName || "SMK Mitra IDUKA"}
                      paperSize={layoutSettings.certificatePaperSize || "A4"}
                      paperWidthCm={layoutSettings.paperWidthCm || 29.7}
                      paperHeightCm={layoutSettings.paperHeightCm || 21.0}
                      layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                      bgPath={selectedCourse?.transcriptTemplate || layoutSettings.transcriptTemplate || layoutSettings.transcriptBgPath}
                      layoutConfig={layoutSettings.transcriptLayoutConfig}
                    />
                  )}
                </div>
              </div>

              <div className="w-full flex items-center justify-between text-[11px] text-slate-500 mt-4 px-2 select-none">
                <span>💡 Gunakan <b>Ctrl + Scroll Mouse</b> untuk zoom cepat.</span>
                <span>Ukuran Efektif: <b>{scaledW} × {scaledH} px</b> ({previewZoom}%)</span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900 flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loadingIssue}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Kembali & Edit
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleIssue}
                  disabled={loadingIssue}
                  className="px-7 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {loadingIssue ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Menerbitkan & Minting Blockchain...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Konfirmasi & Terbitkan ke Blockchain
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX PREVIEW MODAL */}
      {isFullscreenPreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setIsFullscreenPreview(false)}
        >
          {/* Header Lightbox */}
          <div
            className="flex items-center justify-between w-full pb-4 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Inspeksi Layar Penuh {previewTab === "front" ? "Sertifikat (Halaman 1)" : "Transkrip Nilai (Halaman 2)"}
                </h3>
                <span className="text-[11px] font-mono text-cyan-400">
                  {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm ({layoutSettings.certificatePaperSize || "A4"})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Zoom Controls di Fullscreen */}
              <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFullscreenZoom((z) => Math.max(20, z - 5))}
                  className="p-1 text-white/60 hover:text-cyan-400 rounded-lg"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono text-white/90 w-14 text-center font-bold">
                  {fullscreenZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setFullscreenZoom((z) => Math.min(200, z + 5))}
                  className="p-1 text-white/60 hover:text-cyan-400 rounded-lg"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={() => setFullscreenZoom(70)}
                  className="px-2 py-0.5 text-xs text-white/70 hover:text-white rounded"
                  title="Reset Fit"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenZoom(100)}
                  className="px-2 py-0.5 text-xs text-white/70 hover:text-white rounded"
                  title="100% Size"
                >
                  100%
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreenPreview(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <X size={14} />
                <span>Tutup (Esc)</span>
              </button>
            </div>
          </div>

          {/* Body Lightbox Viewport */}
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                  setFullscreenZoom((z) => Math.min(200, z + 5));
                } else {
                  setFullscreenZoom((z) => Math.max(20, z - 5));
                }
              }
            }}
            className="flex-1 overflow-auto p-6 flex items-center justify-center custom-scrollbar"
          >
            <div
              style={{
                width: `${fullscreenScaledW}px`,
                height: `${fullscreenScaledH}px`,
                minWidth: `${fullscreenScaledW}px`,
                minHeight: `${fullscreenScaledH}px`,
                transition: "width 0.12s ease-out, height 0.12s ease-out",
              }}
              className="relative shrink-0 shadow-2xl rounded-lg overflow-hidden border border-white/10 m-auto"
            >
              <div
                style={{
                  width: `${canvasPxW}px`,
                  height: `${canvasPxH}px`,
                  transform: `scale(${fullscreenZoom / 100})`,
                  transformOrigin: "top left",
                  transition: "transform 0.12s ease-out",
                }}
                className="absolute top-0 left-0 select-none"
              >
                {previewTab === "front" ? (
                  <CertificateTemplate
                    studentName={foundStudent?.name}
                    studentId={foundStudent?.studentId || foundStudent?.nim || foundStudent?.nisn}
                    courseName={selectedCourse?.title || "Program Keahlian"}
                    program={foundStudent?.studyProgram || foundStudent?.program || selectedCourse?.title || "Program Keahlian"}
                    majority={foundStudent?.majority || "Teknik Informatika"}
                    issuedAt={new Date().toISOString()}
                    layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                    paperSize={layoutSettings.certificatePaperSize || "A4"}
                    paperWidthCm={layoutSettings.paperWidthCm || 29.7}
                    paperHeightCm={layoutSettings.paperHeightCm || 21.0}
                    instructorName={examinerName || (layoutSettings.instructors && layoutSettings.instructors[0]?.name) || layoutSettings.instructorName}
                    instructorNip={examinerNip || (layoutSettings.instructors && layoutSettings.instructors[0]?.nip) || layoutSettings.instructorNip}
                    instructors={layoutSettings.instructors}
                    institutionLogo={layoutSettings.institutionLogo}
                    institutionName={layoutSettings.institutionName}
                    institutionSubtext={layoutSettings.institutionSubtext}
                    bgPath={selectedCourse?.certificateTemplate || layoutSettings.certificateTemplate || layoutSettings.bgPath}
                    layoutConfig={layoutSettings.layoutConfig}
                  />
                ) : (
                  <CertificateTranscriptPage
                    studentName={foundStudent?.name}
                    studentId={foundStudent?.studentId || foundStudent?.nim || foundStudent?.nisn}
                    majority={foundStudent?.majority || "Teknik Komputer dan Jaringan"}
                    program={foundStudent?.studyProgram || foundStudent?.program || selectedCourse?.title}
                    courseTitle={selectedCourse?.title}
                    units={competencyUnits}
                    averageScore={averageScore}
                    examinerName={examinerName || (layoutSettings.instructors && layoutSettings.instructors[0]?.name) || layoutSettings.instructorName || "Penguji / Asesor"}
                    examinerNip={examinerNip || (layoutSettings.instructors && layoutSettings.instructors[0]?.nip) || layoutSettings.instructorNip || "-"}
                    institutionLogo={layoutSettings.institutionLogo}
                    institutionName={layoutSettings.institutionName}
                    institutionSubtext={layoutSettings.institutionSubtext}
                    schoolName={layoutSettings.institutionName || schoolOrigin || selectedCourse?.schoolName || layoutSettings.schoolName || "SMK Mitra IDUKA"}
                    paperSize={layoutSettings.certificatePaperSize || "A4"}
                    paperWidthCm={layoutSettings.paperWidthCm || 29.7}
                    paperHeightCm={layoutSettings.paperHeightCm || 21.0}
                    layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                    bgPath={selectedCourse?.transcriptTemplate || layoutSettings.transcriptTemplate || layoutSettings.transcriptBgPath}
                    layoutConfig={layoutSettings.transcriptLayoutConfig}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
