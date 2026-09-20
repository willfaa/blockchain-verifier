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
  Users,
  UserCheck,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Send,
  GraduationCap,
  QrCode,
  Upload,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import QRCode from "qrcode";
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

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  nim?: string;
  nisn?: string;
  avatar?: string;
  image?: string;
  avatarUrl?: string;
  majority?: string | { id: string; name: string };
  studyProgram?: string | { id: string; name: string };
  schoolOrigin?: string;
  birthPlaceDate?: string;
}

interface BatchStudentScore {
  student: StudentRecord;
  scores: Record<string, string>; // unitCode -> score
  customAverageScore?: string;
  certificateNumber?: string;
  birthPlaceDate?: string;
  schoolOrigin?: string;
}

export default function SmartIssueCertificatePage() {
  // Primary Workflow Tab: "system" (Auto-Generate UKK) vs "pre_issued" (Amankan Sertifikat Jadi)
  const [issuanceTab, setIssuanceTab] = useState<"system" | "pre_issued">("system");

  // Mode: "batch" (Massal via Student Directory) vs "single" (Individu via Quick Search)
  const [issueMode, setIssueMode] = useState<"batch" | "single">("batch");

  // Loading States
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Preview Modal States
  const [showModal, setShowModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<"front" | "transcript">("front");
  const [previewZoom, setPreviewZoom] = useState<number>(55);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(70);
  const [previewTargetStudent, setPreviewTargetStudent] = useState<StudentRecord | null>(null);

  // Single Search State
  const [searchStudentId, setSearchStudentId] = useState("");
  const [foundStudent, setFoundStudent] = useState<StudentRecord | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Student Directory State (for Batch Issuance)
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [dirSearch, setDirSearch] = useState("");
  const [dirMajorFilter, setDirMajorFilter] = useState("ALL");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchScores, setBatchScores] = useState<Record<string, BatchStudentScore>>({});

  // Course & Hierarchy State
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [majorsList, setMajorsList] = useState<any[]>([]);

  // Page Format & Master Units State
  const [pageMode, setPageMode] = useState<"SINGLE" | "DOUBLE">("DOUBLE");
  const [availableUnits, setAvailableUnits] = useState<CompetencyItem[]>([]);
  const [selectedUnitCodes, setSelectedUnitCodes] = useState<string[]>([]);
  const [defaultUnitScores, setDefaultUnitScores] = useState<Record<string, string>>({});

  // Global Issuer / Examiner Metadata
  const [schoolOrigin, setSchoolOrigin] = useState("");
  const [examinerName, setExaminerName] = useState("");
  const [examinerNip, setExaminerNip] = useState("");
  const [certificateNumberPrefix, setCertificateNumberPrefix] = useState("");
  const [birthPlaceDate, setBirthPlaceDate] = useState("");

  // Pre-Issued Certificate Securing States (Sertifikat Jadi Scan / PDF)
  const [preIssuedPage1File, setPreIssuedPage1File] = useState<File | null>(null);
  const [preIssuedPage1Preview, setPreIssuedPage1Preview] = useState<string>("");
  const [preIssuedPage2File, setPreIssuedPage2File] = useState<File | null>(null);
  const [preIssuedPage2Preview, setPreIssuedPage2Preview] = useState<string>("");
  const [preIssuedActivePreviewPage, setPreIssuedActivePreviewPage] = useState<"page1" | "page2">("page1");

  const [preIssuedStudent, setPreIssuedStudent] = useState<StudentRecord | null>(null);
  const [preIssuedStudentSearch, setPreIssuedStudentSearch] = useState<string>("");
  const [preIssuedCertNumber, setPreIssuedCertNumber] = useState<string>("11-0159-0164-8");
  const [preIssuedSchoolName, setPreIssuedSchoolName] = useState<string>("SMKS Senopati Sedati");
  const [preIssuedMajor, setPreIssuedMajor] = useState<string>("Teknik Komputer dan Jaringan");
  const [preIssuedProgram, setPreIssuedProgram] = useState<string>("Teknik Komputer dan Jaringan");
  const [preIssuedAssignmentTitle, setPreIssuedAssignmentTitle] = useState<string>("Rancang Bangun Keamanan Jaringan dan Konfigurasi Server");
  const [preIssuedPredicate, setPreIssuedPredicate] = useState<string>("Kompeten");
  const [preIssuedIssueDate, setPreIssuedIssueDate] = useState<string>("Sidoarjo, 13 Februari 2026");
  const [preIssuedInternalAssessor, setPreIssuedInternalAssessor] = useState<string>("TEGUH AGUS SETIAWAN S.Kom");
  const [preIssuedInternalInstitution, setPreIssuedInternalInstitution] = useState<string>("SMKS SENOPATI SEDATI");
  const [preIssuedExternalAssessor, setPreIssuedExternalAssessor] = useState<string>("BAMBANG SOERJOHANDOKO");
  const [preIssuedExternalInstitution, setPreIssuedExternalInstitution] = useState<string>("PT SKILL INDOTIMUR AGUNG");

  const [preIssuedStampPreset, setPreIssuedStampPreset] = useState<"admin" | "bottom-right" | "bottom-left" | "bottom-center">("admin");
  const [preIssuedStampPos, setPreIssuedStampPos] = useState<{ x?: number; y?: number; width?: number; height?: number } | null>(null);
  const [preIssuedQrBase64, setPreIssuedQrBase64] = useState<string>("");
  const [preIssuedLoading, setPreIssuedLoading] = useState<boolean>(false);
  const [preIssuedSuccessResult, setPreIssuedSuccessResult] = useState<any | null>(null);
  const [standardSuccessResults, setStandardSuccessResults] = useState<any[] | null>(null);
  const [preIssuedCopiedHash, setPreIssuedCopiedHash] = useState<boolean>(false);
  const [preIssuedPreviewZoom, setPreIssuedPreviewZoom] = useState<number>(65);

  // Admin / Public LMS Layout Settings State
  const [layoutSettings, setLayoutSettings] = useState<any>({});

  // 1. Fetch Courses, Majors, Layout Settings, and Student Directory on Mount
  useEffect(() => {
    const initData = async () => {
      setLoadingStudents(true);
      try {
        const [coursesRes, settingsRes, studentsRes, majorsRes] = await Promise.allSettled([
          api.get("/lms/teacher/my-courses"),
          api.get("/lms/settings"),
          api.get("/users?role=student"),
          api.get("/admin/departments/konsentrasi"),
        ]);

        if (coursesRes.status === "fulfilled" && coursesRes.value?.data?.ok) {
          setCourses(coursesRes.value.data.data || []);
        }

        if (studentsRes.status === "fulfilled" && studentsRes.value?.data?.data) {
          setAllStudents(studentsRes.value.data.data || []);
        }

        if (majorsRes.status === "fulfilled" && majorsRes.value?.data?.data) {
          setMajorsList(majorsRes.value.data.data || []);
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value?.data?.settings) {
          const s = settingsRes.value.data.settings;
          setLayoutSettings(s);

          // Set default examiner
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
      } finally {
        setLoadingStudents(false);
      }
    };
    initData();
  }, []);

  // 2. Fetch Course / Master Competency Units when Course Selection Changes
  useEffect(() => {
    if (!courseId) {
      setSelectedCourse(null);
      setAvailableUnits([]);
      setSelectedUnitCodes([]);
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
          const formatted: CompetencyItem[] = res.data.data.map((u: any, idx: number) => ({
            code: u.code || `UNIT-${idx + 1}`,
            title: u.title || `Unit Kompetensi ${idx + 1}`,
            standard: u.standard || "SKKNI",
            score: u.score !== undefined && u.score !== null ? String(u.score) : "90.00",
            result: u.result || "KOMPETEN",
          }));
          setAvailableUnits(formatted);
          setSelectedUnitCodes(formatted.map((u) => u.code || ""));

          const initialScores: Record<string, string> = {};
          formatted.forEach((u) => {
            if (u.code) initialScores[u.code] = String(u.score || "90.00");
          });
          setDefaultUnitScores(initialScores);
        } else {
          // Provide standard initial vocational units fallback
          const standardFallbacks: CompetencyItem[] = [
            { code: "J.620100.004.01", title: "Memahami dasar pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.009.02", title: "Memahami tipe data dan variable", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.017.02", title: "Menerapkan operator dan percabangan", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.025.02", title: "Menerapkan algoritma pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
            { code: "J.620100.033.02", title: "Menerapkan debugging dan error handling", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          ];
          setAvailableUnits(standardFallbacks);
          setSelectedUnitCodes(standardFallbacks.map((u) => u.code || ""));
          const initialScores: Record<string, string> = {};
          standardFallbacks.forEach((u) => {
            if (u.code) initialScores[u.code] = "90.00";
          });
          setDefaultUnitScores(initialScores);
        }
      })
      .catch(() => {
        const standardFallbacks: CompetencyItem[] = [
          { code: "J.620100.004.01", title: "Memahami dasar pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.009.02", title: "Memahami tipe data dan variable", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
        ];
        setAvailableUnits(standardFallbacks);
        setSelectedUnitCodes(standardFallbacks.map((u) => u.code || ""));
      })
      .finally(() => setLoadingUnits(false));
  }, [courseId, courses]);

  // Active units included in transcript based on teacher checklist
  const activeTranscriptUnits = useMemo(() => {
    return availableUnits.filter((u) => u.code && selectedUnitCodes.includes(u.code));
  }, [availableUnits, selectedUnitCodes]);

  // Filtered Students in Student Directory
  const filteredStudents = useMemo(() => {
    return allStudents.filter((std) => {
      const q = dirSearch.toLowerCase().trim();
      const nameMatch = !q || std.name?.toLowerCase().includes(q) || std.email?.toLowerCase().includes(q) || (std.studentId || std.nim || std.nisn || "").toLowerCase().includes(q);

      let majorStr = "";
      if (typeof std.majority === "object" && std.majority !== null) majorStr = (std.majority as any).name || "";
      else majorStr = String(std.majority || "");

      const majorMatch = dirMajorFilter === "ALL" || majorStr.toLowerCase().includes(dirMajorFilter.toLowerCase());

      return nameMatch && majorMatch;
    });
  }, [allStudents, dirSearch, dirMajorFilter]);

  // Toggle selection for a single student in Directory
  const handleToggleSelectStudent = (student: StudentRecord) => {
    const isSelected = selectedStudentIds.includes(student.id);
    if (isSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
      setBatchScores((prev) => {
        const copy = { ...prev };
        delete copy[student.id];
        return copy;
      });
    } else {
      setSelectedStudentIds((prev) => [...prev, student.id]);
      setBatchScores((prev) => ({
        ...prev,
        [student.id]: {
          student,
          scores: { ...defaultUnitScores },
          schoolOrigin: student.schoolOrigin || schoolOrigin || "SMK Mitra IDUKA",
          birthPlaceDate: student.birthPlaceDate || "",
        },
      }));
    }
  };

  // Select All / Unselect All Filtered Students
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));

    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      setBatchScores((prev) => {
        const copy = { ...prev };
        filteredIds.forEach((id) => delete copy[id]);
        return copy;
      });
    } else {
      const newIds = Array.from(new Set([...selectedStudentIds, ...filteredIds]));
      setSelectedStudentIds(newIds);

      const newBatch = { ...batchScores };
      filteredStudents.forEach((std) => {
        if (!newBatch[std.id]) {
          newBatch[std.id] = {
            student: std,
            scores: { ...defaultUnitScores },
            schoolOrigin: std.schoolOrigin || schoolOrigin || "SMK Mitra IDUKA",
            birthPlaceDate: std.birthPlaceDate || "",
          };
        }
      });
      setBatchScores(newBatch);
    }
  };

  // Toggle Unit Inclusion in Certificate Transcript
  const handleToggleUnitInclusion = (unitCode: string) => {
    if (selectedUnitCodes.includes(unitCode)) {
      if (selectedUnitCodes.length === 1) {
        toast.warning("Minimal sertifikat harus memiliki 1 unit kompetensi.");
        return;
      }
      setSelectedUnitCodes((prev) => prev.filter((c) => c !== unitCode));
    } else {
      setSelectedUnitCodes((prev) => [...prev, unitCode]);
    }
  };

  // Add a new Custom Unit on the fly
  const handleAddNewCustomUnit = () => {
    const newCode = `UNIT-CUST-${availableUnits.length + 1}`;
    const newUnit: CompetencyItem = {
      code: newCode,
      title: "Unit Kompetensi Proyek Khusus",
      standard: "IDUKA",
      score: "90.00",
      result: "KOMPETEN",
    };
    setAvailableUnits((prev) => [...prev, newUnit]);
    setSelectedUnitCodes((prev) => [...prev, newCode]);
    setDefaultUnitScores((prev) => ({ ...prev, [newCode]: "90.00" }));

    // Update existing batch records with new unit
    setBatchScores((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((sId) => {
        copy[sId].scores[newCode] = "90.00";
      });
      return copy;
    });

    toast.success("Unit kompetensi baru berhasil ditambahkan ke daftar.");
  };

  // Update Individual Student Score in Batch Table
  const handleUpdateStudentUnitScore = (studentId: string, unitCode: string, scoreVal: string) => {
    setBatchScores((prev) => {
      const current = prev[studentId] || {
        student: allStudents.find((s) => s.id === studentId)!,
        scores: { ...defaultUnitScores },
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          scores: {
            ...current.scores,
            [unitCode]: scoreVal,
          },
        },
      };
    });
  };

  // Bulk Quick Fill for All Selected Students
  const handleBulkQuickFillAllStudents = (scoreVal: string) => {
    setBatchScores((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((stdId) => {
        const studentScores: Record<string, string> = {};
        activeTranscriptUnits.forEach((u) => {
          if (u.code) studentScores[u.code] = scoreVal;
        });
        updated[stdId] = {
          ...updated[stdId],
          scores: studentScores,
        };
      });
      return updated;
    });
    toast.success(`Seluruh nilai siswa berhasil diset ke ${scoreVal}`);
  };

  // Compute average score for a student record
  const getStudentAverageScore = (studentId: string) => {
    const record = batchScores[studentId];
    if (!record || activeTranscriptUnits.length === 0) return "90.00";
    const validScores = activeTranscriptUnits
      .map((u) => parseFloat(record.scores[u.code || ""] || "0"))
      .filter((s) => !isNaN(s));
    if (validScores.length === 0) return "0.00";
    const sum = validScores.reduce((a, b) => a + b, 0);
    return (sum / validScores.length).toFixed(2);
  };

  // Handler: Single Mode Search
  const handleSingleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchStudentId.trim();
    if (!cleanId) return;

    setLoadingSearch(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      const res = await api.get(`/auth/student/${encodeURIComponent(cleanId)}`);
      if (res.data.ok && res.data.student) {
        const std = res.data.student;
        setFoundStudent(std);
        if (std.schoolOrigin && !schoolOrigin) setSchoolOrigin(std.schoolOrigin);
        if (std.birthPlaceDate && !birthPlaceDate) setBirthPlaceDate(std.birthPlaceDate);
      } else {
        setSearchError("Data siswa tidak ditemukan di database.");
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.error || "Siswa tidak ditemukan dalam registri.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Open Preview Modal (Single or Specific Student from Batch)
  const handleOpenPreviewForStudent = (student: StudentRecord) => {
    if (!courseId) {
      toast.error("Harap pilih Course / Program Pelatihan terlebih dahulu.");
      return;
    }
    setPreviewTargetStudent(student);
    setPreviewTab("front");
    setShowModal(true);
  };

  // Compile full Competency Items for Target Student
  const getActiveUnitsForStudent = (studentId?: string): CompetencyItem[] => {
    if (!studentId || !batchScores[studentId]) {
      return activeTranscriptUnits.map((u) => ({
        ...u,
        score: u.score || "90.00",
      }));
    }
    const rec = batchScores[studentId];
    return activeTranscriptUnits.map((u) => ({
      ...u,
      score: u.code && rec.scores[u.code] !== undefined ? rec.scores[u.code] : (u.score || "90.00"),
    }));
  };

  // Execute Certificate Issuance (Batch or Single)
  const handleExecuteIssue = async () => {
    if (!courseId) {
      toast.error("Harap pilih Course terlebih dahulu.");
      return;
    }

    const studentsToIssue: { student: StudentRecord; scores: Record<string, string> }[] = [];

    if (issueMode === "single") {
      if (!foundStudent) {
        toast.error("Harap cari dan pilih siswa terlebih dahulu.");
        return;
      }
      studentsToIssue.push({
        student: foundStudent,
        scores: defaultUnitScores,
      });
    } else {
      if (selectedStudentIds.length === 0) {
        toast.error("Pilih minimal 1 siswa dari daftar untuk diterbitkan sertifikat.");
        return;
      }
      selectedStudentIds.forEach((sId) => {
        const std = allStudents.find((s) => s.id === sId);
        if (std) {
          studentsToIssue.push({
            student: std,
            scores: batchScores[sId]?.scores || defaultUnitScores,
          });
        }
      });
    }

    setLoadingIssue(true);
    setBatchProgress({ current: 0, total: studentsToIssue.length });

    let successCount = 0;
    let failCount = 0;
    const issuedList: any[] = [];

    for (let i = 0; i < studentsToIssue.length; i++) {
      const item = studentsToIssue[i];
      setBatchProgress({ current: i + 1, total: studentsToIssue.length });

      const stdUnits = activeTranscriptUnits.map((u) => ({
        code: u.code,
        title: u.title,
        standard: u.standard || "SKKNI",
        score: u.code && item.scores[u.code] ? item.scores[u.code] : "90.00",
        result: u.result || "KOMPETEN",
      }));

      const validScores = stdUnits.map((u) => parseFloat(u.score || "0")).filter((s) => !isNaN(s));
      const studentAvg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2) : "90.00";

      const payload: any = {
        name: item.student.name,
        studentName: item.student.name,
        studentId: item.student.studentId || item.student.nim || item.student.nisn || item.student.id,
        program: typeof item.student.studyProgram === "object" ? (item.student.studyProgram as any)?.name : item.student.studyProgram || selectedCourse?.title || "Program Keahlian",
        majority: typeof item.student.majority === "object" ? (item.student.majority as any)?.name : item.student.majority || "Teknik Informatika",
        courseId: courseId,
        courseName: selectedCourse?.title,
        schoolName: schoolOrigin || selectedCourse?.schoolName || layoutSettings.schoolName || "SMK Mitra IDUKA",
        birthPlaceDate: item.student.birthPlaceDate || birthPlaceDate.trim() || undefined,
        schoolOrigin: item.student.schoolOrigin || schoolOrigin.trim() || undefined,
        certificateNumber: certificateNumberPrefix ? `${certificateNumberPrefix}-${item.student.studentId || "001"}` : undefined,
        layoutMode: pageMode === "DOUBLE" ? "DUPLEX_2_PAGES" : "STANDARD",
        competencyUnits: stdUnits,
        averageScore: studentAvg,
        signers:
          Array.isArray(layoutSettings.instructors) && layoutSettings.instructors.length > 0
            ? layoutSettings.instructors.map((inst: any, idx: number) => ({
                name: idx === 0 && examinerName ? examinerName : inst.name,
                title: inst.title || (idx === 0 ? "Penguji / Asesor Uji Kompetensi Keahlian" : "Mitra Industri"),
                nip: idx === 0 && examinerNip ? examinerNip : inst.nip || "-",
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

      try {
        let res;
        try {
          res = await api.post("/certificates/issue", payload);
        } catch (apiErr) {
          const cloudRes = await fetch("/api/certificates/issue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await cloudRes.json();
          res = { data: json };
        }

        if (res.data?.ok) {
          successCount++;
          const certRecord = res.data.record || res.data.data || {};
          issuedList.push({
            certId: res.data.certId || certRecord.certId || certRecord.id,
            name: item.student.name,
            studentId: payload.studentId,
            program: payload.program,
            certificateNumber: certRecord.certificateNumber || payload.certificateNumber || `UKK/${(res.data.certId || "").substring(0, 8).toUpperCase()}`,
            txId: res.data.txId || certRecord.blockchainTxId || "ON_CHAIN_SYNCED",
            hash: res.data.hash || certRecord.hash || "",
          });
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    setLoadingIssue(false);
    setBatchProgress(null);
    setShowModal(false);

    if (successCount > 0) {
      setStandardSuccessResults(issuedList);
      toast.success(`Sukses! ${successCount} Sertifikat Berhasil Diterbitkan & Dimint ke Blockchain Ledger ⚡`, {
        description: failCount > 0 ? `${failCount} sertifikat gagal diproses.` : "Seluruh siswa telah memiliki bukti kriptografis.",
      });

      // Clear selection
      if (issueMode === "single") {
        setFoundStudent(null);
        setSearchStudentId("");
      } else {
        setSelectedStudentIds([]);
        setBatchScores({});
      }
    } else {
      toast.error("Gagal memproses penerbitan sertifikat.");
    }
  };

  // Generate sample QR code for pre-issued preview
  useEffect(() => {
    const dummyId = preIssuedStudent ? (preIssuedStudent.studentId || preIssuedStudent.id) : "2026-0001";
    const clientBase = typeof window !== "undefined" ? window.location.origin : "https://www.willfaa.web.id";
    QRCode.toDataURL(`${clientBase}/verify/CERT-2026-${dummyId.substring(0, 8).toUpperCase()}`, {
      margin: 1,
      width: 256,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setPreIssuedQrBase64)
      .catch(() => {});
  }, [preIssuedStudent]);

  // Handle file uploads for page 1 and page 2
  const handlePreIssuedPageUpload = (page: "page1" | "page2", file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (page === "page1") {
        setPreIssuedPage1File(file);
        setPreIssuedPage1Preview(dataUrl);
        setPreIssuedActivePreviewPage("page1");
        toast.success(`Halaman 1 (${file.name}) siap dipratinjau dengan Stamp Tipe A 1:1.`);
      } else {
        setPreIssuedPage2File(file);
        setPreIssuedPage2Preview(dataUrl);
        setPreIssuedActivePreviewPage("page2");
        toast.success(`Halaman 2 / Transkrip (${file.name}) berhasil dimuat.`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper 1-Klik: Muat Contoh Sertifikat SMK TKJ Moch. Ubaidilah
  const handleLoadSampleCertificate = () => {
    // Fill sample metadata
    setPreIssuedCertNumber("11-0159-0164-8");
    setPreIssuedSchoolName("SMKS Senopati Sedati");
    setPreIssuedMajor("Teknik Komputer dan Jaringan");
    setPreIssuedProgram("Teknik Komputer dan Jaringan");
    setPreIssuedAssignmentTitle("Rancang Bangun Keamanan Jaringan dan Konfigurasi Server");
    setPreIssuedPredicate("Kompeten");
    setPreIssuedIssueDate("Sidoarjo, 13 Februari 2026");
    setPreIssuedInternalAssessor("TEGUH AGUS SETIAWAN S.Kom");
    setPreIssuedInternalInstitution("SMKS SENOPATI SEDATI");
    setPreIssuedExternalAssessor("BAMBANG SOERJOHANDOKO");
    setPreIssuedExternalInstitution("PT SKILL INDOTIMUR AGUNG");

    // Match or create dummy student
    const matched = allStudents.find((s) => s.name?.toLowerCase().includes("ubaidilah")) || {
      id: "student-sample-ubaidilah",
      name: "MOCH. UBAIDILAH",
      studentId: "0084547653",
      nisn: "0084547653",
      email: "ubaidilah@smksenopati.sch.id",
      majority: "Teknik Komputer dan Jaringan",
      studyProgram: "Teknik Komputer dan Jaringan",
      schoolOrigin: "SMKS Senopati Sedati",
    };
    setPreIssuedStudent(matched);

    // Generate high quality sample scanned certificate image preview if none uploaded
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1754;
      canvas.height = 1240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Background
        ctx.fillStyle = "#faf7f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ornate Border
        ctx.strokeStyle = "#8b6f38";
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

        ctx.strokeStyle = "#c5a059";
        ctx.lineWidth = 3;
        ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

        // Header Texts
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 34px serif";
        ctx.textAlign = "center";
        ctx.fillText("SERTIFIKAT UJI KOMPETENSI KEAHLIAN", canvas.width / 2, 150);

        ctx.font = "italic 20px serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("Nomor Sertifikat: 11-0159-0164-8", canvas.width / 2, 195);

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#334155";
        ctx.fillText("Diberikan Kepada Siswa / Peserta Didik:", canvas.width / 2, 260);

        // Student Name
        ctx.font = "bold 46px sans-serif";
        ctx.fillStyle = "#0f172a";
        ctx.fillText("MOCH. UBAIDILAH", canvas.width / 2, 330);

        // Underline
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 260, 345);
        ctx.lineTo(canvas.width / 2 + 260, 345);
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText("NISN: 0084547653  ·  Satuan Pendidikan: SMKS Senopati Sedati", canvas.width / 2, 385);

        ctx.font = "20px sans-serif";
        ctx.fillText("Telah menyelesaikan Uji Kompetensi Keahlian pada Program Keahlian:", canvas.width / 2, 450);

        ctx.font = "bold 30px sans-serif";
        ctx.fillStyle = "#0369a1";
        ctx.fillText("TEKNIK KOMPUTER DAN JARINGAN", canvas.width / 2, 500);

        ctx.font = "bold 24px sans-serif";
        ctx.fillStyle = "#15803d";
        ctx.fillText("Predikat: KOMPETEN (SANGAT BAIK)", canvas.width / 2, 550);

        ctx.font = "italic 18px sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText('Skema Penugasan: "Rancang Bangun Keamanan Jaringan dan Konfigurasi Server"', canvas.width / 2, 595);

        // Assessor details
        ctx.textAlign = "left";
        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText("Penguji Internal:", 200, 820);
        ctx.font = "16px sans-serif";
        ctx.fillText("TEGUH AGUS SETIAWAN, S.Kom", 200, 920);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("SMKS SENOPATI SEDATI", 200, 945);

        ctx.textAlign = "right";
        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText("Asesor Industri (Eksternal):", canvas.width - 200, 820);
        ctx.font = "16px sans-serif";
        ctx.fillText("BAMBANG SOERJOHANDOKO", canvas.width - 200, 920);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText("PT SKILL INDOTIMUR AGUNG", canvas.width - 200, 945);

        const generatedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setPreIssuedPage1Preview(generatedDataUrl);
        setPreIssuedActivePreviewPage("page1");
      }
    } catch (e) {
      console.warn("Could not generate canvas sample:", e);
    }

    toast.success("Contoh Data Sertifikat SMK TKJ (Moch. Ubaidilah) Berhasil Dimuat!");
  };

  // Handle Securing and Minting to Blockchain
  const handleSecurePreIssuedCertificate = async () => {
    if (!preIssuedPage1File && !preIssuedPage1Preview) {
      toast.error("Wajib mengunggah berkas Halaman 1 Sertifikat Jadi (Gambar / PDF).");
      return;
    }

    const targetStudentName = preIssuedStudent?.name || foundStudent?.name;
    const targetStudentId =
      preIssuedStudent?.studentId ||
      preIssuedStudent?.nim ||
      preIssuedStudent?.nisn ||
      preIssuedStudent?.id ||
      foundStudent?.studentId ||
      "0084547653";

    if (!targetStudentName) {
      toast.error("Pilih atau tentukan nama siswa terlebih dahulu.");
      return;
    }

    setPreIssuedLoading(true);
    try {
      const formData = new FormData();
      if (preIssuedPage1File) {
        formData.append("page1", preIssuedPage1File);
      } else if (preIssuedPage1Preview) {
        formData.append("page1Base64", preIssuedPage1Preview);
      }

      if (preIssuedPage2File) {
        formData.append("page2", preIssuedPage2File);
      } else if (preIssuedPage2Preview) {
        formData.append("page2Base64", preIssuedPage2Preview);
      }

      const certId = `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      formData.append("certId", certId);
      formData.append("studentId", targetStudentId);
      formData.append("name", targetStudentName);
      formData.append("certificateNumber", preIssuedCertNumber);
      formData.append("schoolName", preIssuedSchoolName);
      formData.append("majority", preIssuedMajor);
      formData.append("program", preIssuedProgram);
      formData.append("issuedAt", preIssuedIssueDate);

      const signers = [
        {
          name: preIssuedInternalAssessor,
          title: "Penguji Internal / Kepala Sekolah",
          role: "INTERNAL",
          institution: preIssuedInternalInstitution,
        },
        {
          name: preIssuedExternalAssessor,
          title: "Penguji Eksternal / Asesor Industri",
          role: "EXTERNAL",
          institution: preIssuedExternalInstitution,
        },
      ];
      formData.append("signers", JSON.stringify(signers));

      if (preIssuedStampPos) {
        formData.append("customStampPosition", JSON.stringify(preIssuedStampPos));
      }

      let res;
      try {
        res = await fetch("/api/certificates/stamp-existing", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Cloud endpoint fallback");
      } catch (cloudErr) {
        res = await api.post("/certificates/stamp-existing", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      let resData;
      if (typeof (res as any).json === "function") {
        resData = await (res as any).json();
      } else {
        resData = (res as any).data;
      }

      if (resData.ok) {
        setPreIssuedSuccessResult(resData);
        toast.success("🛡️ Sertifikat Jadi Berhasil Diamankan & Terverifikasi Blockchain!", {
          description: `Merkle Fingerprint SHA-256 dan Transaksi Fabric telah tercatat permanen.`,
        });
      } else {
        toast.error(resData.error || "Gagal mengamankan sertifikat.");
      }
    } catch (err: any) {
      console.error("Failed to secure pre-issued certificate:", err);
      toast.error(err?.message || "Terjadi kesalahan saat mengamankan sertifikat.");
    } finally {
      setPreIssuedLoading(false);
    }
  };

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

  const activeTargetStudent = previewTargetStudent || foundStudent || (selectedStudentIds.length > 0 ? allStudents.find((s) => s.id === selectedStudentIds[0]) : null);
  const targetStudentUnits = getActiveUnitsForStudent(activeTargetStudent?.id);
  const targetAvgScore = activeTargetStudent ? getStudentAverageScore(activeTargetStudent.id) : "90.00";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Smart <span className="text-cyan-400">Certificate Issuance</span>
                <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  {issuanceTab === "pre_issued" ? "Pre-Issued Stamp 1:1" : "Batch & Individual"}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Pilih antara pembuatan sertifikat desain sistem baru atau amankan berkas fisik/scan yang sudah terbit dengan Stamp 1:1 QR code.
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Mode Indicators */}
        {issuanceTab === "system" && (
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-white/10 shadow-xl">
            <button
              type="button"
              onClick={() => setIssueMode("batch")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                issueMode === "batch"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users size={16} />
              <span>Penerbitan Massal (Batch)</span>
            </button>
            <button
              type="button"
              onClick={() => setIssueMode("single")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                issueMode === "single"
                  ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck size={16} />
              <span>Penerbitan Individu (Single)</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Workflow Switcher */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-2 rounded-2xl border border-white/10 shadow-2xl">
        <button
          type="button"
          onClick={() => setIssuanceTab("system")}
          className={`flex-1 min-w-[240px] flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            issuanceTab === "system"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles size={16} />
          <span>Buat Desain Sistem (Auto-Generate UKK)</span>
        </button>
        <button
          type="button"
          onClick={() => setIssuanceTab("pre_issued")}
          className={`flex-1 min-w-[240px] flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            issuanceTab === "pre_issued"
              ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShieldCheck size={16} />
          <span>Amankan Sertifikat Jadi (Scan / PDF Terbit)</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
            Stamp 1:1 QR
          </span>
        </button>
      </div>

      {issuanceTab === "pre_issued" ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Pre-Issued Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  Amankan Sertifikat Fisik / Terbitan Sekolah
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Stamp Tipe A 1:1
                  </span>
                </h2>
                <p className="text-xs text-emerald-200/70 mt-1">
                  Bubuhkan QR Code 1:1 dan ID Sertifikat Standar otomatis pada dokumen yang sudah jadi, lalu minting bukti ke Blockchain Fabric.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleCertificate}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 hover:text-white text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-2 shadow-sm"
                title="Muat contoh sertifikat SMK TKJ Moch. Ubaidilah yang diunggah"
              >
                <span>⚡ Muat Contoh SMK TKJ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form & Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Step 1: Student Selection */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-400" />
                  Langkah 1: Tentukan Siswa Penerima <span className="text-red-400">*</span>
                </h3>

                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Ketik Nama Siswa atau NISN untuk cari..."
                      value={preIssuedStudentSearch}
                      onChange={(e) => {
                        setPreIssuedStudentSearch(e.target.value);
                        const q = e.target.value.toLowerCase();
                        if (q.length >= 2) {
                          const matched = allStudents.find((s) => s.name.toLowerCase().includes(q) || (s.studentId || "").toLowerCase().includes(q));
                          if (matched) setPreIssuedStudent(matched);
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {preIssuedStudent ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-emerald-500/40">
                          <AvatarFallback className="bg-emerald-950 text-emerald-300 font-bold text-xs">
                            {getInitials(preIssuedStudent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{preIssuedStudent.name}</p>
                          <p className="text-[11px] text-emerald-300/80 font-mono">NISN: {preIssuedStudent.studentId || preIssuedStudent.nisn || "-"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                        ✓ Terpilih
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 text-center">
                      Cari siswa di atas atau klik "Muat Contoh SMK TKJ" untuk auto-fill.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: File Upload (Page 1 Front & Page 2 Transcript) */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Upload size={16} className="text-teal-400" />
                  Langkah 2: Unggah Berkas Sertifikat Jadi <span className="text-red-400">*</span>
                </h3>

                <div className="space-y-4">
                  {/* Upload Page 1 (Front Certificate) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Halaman 1: Sertifikat Depan (Wajib)</span>
                      {preIssuedPage1Preview && (
                        <span className="text-[10px] text-emerald-400 font-mono">✓ Berkas Siap</span>
                      )}
                    </label>
                    <label className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-4 bg-emerald-950/10 hover:bg-emerald-950/20 cursor-pointer flex flex-col items-center justify-center text-center transition-all group">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePreIssuedPageUpload("page1", file);
                        }}
                      />
                      <Upload size={22} className="text-emerald-400 group-hover:scale-110 transition-transform mb-1.5" />
                      <span className="text-xs font-bold text-white">
                        {preIssuedPage1File ? preIssuedPage1File.name : "Klik atau Geser File Sertifikat Depan (JPG / PNG)"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Maksimal 30 MB (Resolusi tinggi didukung)</span>
                    </label>
                  </div>

                  {/* Upload Page 2 (Transcript / Back Page) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Halaman 2: Transkrip Kompetensi (Opsional)</span>
                      {preIssuedPage2Preview && (
                        <span className="text-[10px] text-teal-400 font-mono">✓ Berkas Siap</span>
                      )}
                    </label>
                    <label className="border-2 border-dashed border-white/10 hover:border-teal-400/50 rounded-2xl p-3.5 bg-slate-950/40 hover:bg-teal-950/10 cursor-pointer flex flex-col items-center justify-center text-center transition-all group">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePreIssuedPageUpload("page2", file);
                        }}
                      />
                      <FileText size={18} className="text-slate-400 group-hover:text-teal-400 transition-colors mb-1" />
                      <span className="text-xs font-semibold text-slate-300">
                        {preIssuedPage2File ? preIssuedPage2File.name : "Unggah Transkrip Nilai (Jika ada)"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Step 3: Metadata Details */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck size={16} className="text-cyan-400" />
                  Langkah 3: Metadata & Detail Dokumen
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-300">Nomor Sertifikat</label>
                    <input
                      type="text"
                      value={preIssuedCertNumber}
                      onChange={(e) => setPreIssuedCertNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Contoh: 11-0159-0164-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Jurusan / Keahlian</label>
                    <input
                      type="text"
                      value={preIssuedMajor}
                      onChange={(e) => setPreIssuedMajor(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Predikat / Hasil</label>
                    <input
                      type="text"
                      value={preIssuedPredicate}
                      onChange={(e) => setPreIssuedPredicate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-300">Judul Penugasan / Skema</label>
                    <input
                      type="text"
                      value={preIssuedAssignmentTitle}
                      onChange={(e) => setPreIssuedAssignmentTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-300">Tempat & Tanggal Terbit</label>
                    <input
                      type="text"
                      value={preIssuedIssueDate}
                      onChange={(e) => setPreIssuedIssueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-slate-300">Nama Sekolah</label>
                    <input
                      type="text"
                      value={preIssuedSchoolName}
                      onChange={(e) => setPreIssuedSchoolName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Stamp Placement Presets */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <QrCode size={16} className="text-fuchsia-400" />
                    Posisi Stamp Tipe A 1:1
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30">
                    1:1 Square Lock
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreIssuedStampPreset("admin");
                      setPreIssuedStampPos(null);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      preIssuedStampPreset === "admin"
                        ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    ⚙️ Sesuai Admin Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreIssuedStampPreset("bottom-right");
                      setPreIssuedStampPos({ x: 1020, y: 1450, width: 130, height: 130 });
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      preIssuedStampPreset === "bottom-right"
                        ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    ↘ Pojok Kanan Bawah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreIssuedStampPreset("bottom-center");
                      setPreIssuedStampPos({ x: 620, y: 1450, width: 130, height: 130 });
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      preIssuedStampPreset === "bottom-center"
                        ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    ↓ Tengah Bawah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreIssuedStampPreset("bottom-left");
                      setPreIssuedStampPos({ x: 220, y: 1450, width: 130, height: 130 });
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      preIssuedStampPreset === "bottom-left"
                        ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    ↙ Pojok Kiri Bawah
                  </button>
                </div>
              </div>

              {/* Action Button: Mint to Blockchain */}
              <button
                type="button"
                onClick={handleSecurePreIssuedCertificate}
                disabled={preIssuedLoading || (!preIssuedPage1File && !preIssuedPage1Preview)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transform active:scale-95 transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
              >
                {preIssuedLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Membubuhkan Stamp & Menerbitkan ke Ledger...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    <span>Amankan Dokumen & Mint ke Blockchain ⚡</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Live Interactive Canvas Preview (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreIssuedActivePreviewPage("page1")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        preIssuedActivePreviewPage === "page1"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Award size={14} />
                      <span>Halaman 1 (Depan)</span>
                    </button>
                    {preIssuedPage2Preview && (
                      <button
                        type="button"
                        onClick={() => setPreIssuedActivePreviewPage("page2")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          preIssuedActivePreviewPage === "page2"
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <FileText size={14} />
                        <span>Halaman 2 (Transkrip)</span>
                      </button>
                    )}
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPreIssuedPreviewZoom((z) => Math.max(30, z - 10))}
                      className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono text-white px-1">{preIssuedPreviewZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setPreIssuedPreviewZoom((z) => Math.min(150, z + 10))}
                      className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded"
                    >
                      <ZoomIn size={14} />
                    </button>
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="w-full bg-slate-950 rounded-2xl border border-white/10 p-4 min-h-[560px] flex items-center justify-center overflow-auto custom-scrollbar relative">
                  {preIssuedActivePreviewPage === "page1" ? (
                    preIssuedPage1Preview ? (
                      <div
                        className="relative rounded-lg shadow-2xl overflow-hidden shrink-0 border border-white/20 transition-all"
                        style={{
                          width: `${Math.round(800 * (preIssuedPreviewZoom / 100))}px`,
                          maxWidth: "100%",
                        }}
                      >
                        <img
                          src={preIssuedPage1Preview}
                          alt="Sertifikat Jadi Hal 1"
                          className="w-full h-auto object-contain select-none block"
                        />

                        {/* Stamp Tipe A 1:1 Live Overlay */}
                        <div
                          className="absolute pointer-events-none flex flex-col items-center justify-center"
                          style={{
                            right: preIssuedStampPreset === "bottom-left" ? "auto" : preIssuedStampPreset === "bottom-center" ? "50%" : "8%",
                            left: preIssuedStampPreset === "bottom-left" ? "8%" : preIssuedStampPreset === "bottom-center" ? "auto" : "auto",
                            transform: preIssuedStampPreset === "bottom-center" ? "translateX(50%)" : "none",
                            bottom: "8%",
                          }}
                        >
                          <div className="bg-white p-1.5 rounded-lg border border-slate-300 shadow-xl flex flex-col items-center justify-center">
                            {preIssuedQrBase64 ? (
                              <img src={preIssuedQrBase64} alt="QR Code" className="w-16 h-16 object-contain" />
                            ) : (
                              <QrCode size={56} className="text-slate-900" />
                            )}
                            <div className="mt-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-center">
                              <span className="text-[8px] font-mono font-bold text-sky-700 block whitespace-nowrap">
                                ID: CERT-2026-XXXX
                              </span>
                              <span className="text-[7px] text-slate-500 font-sans block uppercase tracking-tight">
                                SCAN TO VERIFY
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-12 text-slate-400 space-y-3">
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-slate-500">
                          <Upload size={36} />
                        </div>
                        <p className="text-sm font-bold text-white">Belum Ada Berkas Sertifikat Jadi</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Unggah gambar scan sertifikat di panel kiri atau klik "Muat Contoh SMK TKJ" untuk melihat demonstrasi penempelan Stamp Tipe A 1:1.
                        </p>
                      </div>
                    )
                  ) : (
                    preIssuedPage2Preview ? (
                      <div
                        className="relative rounded-lg shadow-2xl overflow-hidden shrink-0 border border-white/20 transition-all"
                        style={{
                          width: `${Math.round(800 * (preIssuedPreviewZoom / 100))}px`,
                          maxWidth: "100%",
                        }}
                      >
                        <img
                          src={preIssuedPage2Preview}
                          alt="Transkrip Hal 2"
                          className="w-full h-auto object-contain select-none block"
                        />
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* --- TOP SETTINGS: COURSE SELECTOR & PAGE FORMAT --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course / Skema Selector */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-cyan-400" />
              Langkah 1: Pilih Course / Skema Sertifikasi <span className="text-red-400">*</span>
            </h3>
            {courseId && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ Kursus Aktif
              </span>
            )}
          </div>

          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:ring-cyan-500 h-14">
              <SelectValue placeholder="-- Pilih Course / Skema Sertifikasi UKK --" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              {courses.length > 0 ? (
                courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id} className="cursor-pointer py-3">
                    {course.title}
                  </SelectItem>
                ))
              ) : (
                <div className="p-4 text-xs text-slate-400 text-center">
                  Belum ada kursus yang dibuat oleh guru ini.
                </div>
              )}
            </SelectContent>
          </Select>

          {!courseId && (
            <p className="text-xs text-amber-300/90 flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              Pilih Course terlebih dahulu untuk memuat unit kompetensi SKKNI dan template sertifikat.
            </p>
          )}
        </div>

        {/* Page Format & Layout Controls */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders size={16} className="text-fuchsia-400" />
            Format Halaman
          </h3>

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
              <span className="text-[10px] text-slate-400">Depan + Transkrip SKKNI</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- STEP 2: MASTER COMPETENCY UNITS CHECKLIST (IF 2-PAGE MODE & COURSE SELECTED) --- */}
      {pageMode === "DOUBLE" && courseId && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-4 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-amber-400" />
                Langkah 2: Penentuan Unit Kompetensi Transkrip (SKKNI / IDUKA)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Centang unit kompetensi yang diikutsertakan dalam transkrip nilai sertifikat siswa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewCustomUnit}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} /> Tambah Unit Custom
              </button>
            </div>
          </div>

          {/* Units Inclusion Checklist */}
          {loadingUnits ? (
            <div className="py-8 flex items-center justify-center gap-2 text-cyan-400 text-xs font-mono">
              <RefreshCw size={16} className="animate-spin" /> Memuat unit kompetensi...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableUnits.map((u) => {
                const isChecked = u.code ? selectedUnitCodes.includes(u.code) : false;

                return (
                  <div
                    key={u.code}
                    onClick={() => u.code && handleToggleUnitInclusion(u.code)}
                    className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                      isChecked
                        ? "bg-cyan-500/10 border-cyan-500/40 text-white shadow-md shadow-cyan-500/5"
                        : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare size={18} className="text-cyan-400" />
                      ) : (
                        <Square size={18} className="text-slate-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-cyan-500/30 font-bold">
                          {u.code}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          {u.standard || "SKKNI"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-snug line-clamp-2">
                        {u.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODE BATCH: STUDENT DIRECTORY + BATCH SCORE TABLE --- */}
      {issueMode === "batch" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Section 1: Student Directory & Multi-Select */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-cyan-400" />
                  Direktori Siswa & Seleksi Massal
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan pencarian, filter jurusan, dan centang siswa yang akan diterbitkan sertifikatnya secara massal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold">
                  {selectedStudentIds.length} Siswa Terpilih
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <CheckSquare size={14} />
                  {filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                    ? "Batalkan Semua"
                    : "Pilih Semua Terfilter"}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  placeholder="Cari siswa berdasarkan nama, NISN, ID, atau email..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
                />
                <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
              </div>

              <div>
                <select
                  value={dirMajorFilter}
                  onChange={(e) => setDirMajorFilter(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                >
                  <option value="ALL">Semua Jurusan / Konsentrasi</option>
                  {majorsList.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Directory Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 max-h-[380px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-white/10 z-10">
                  <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Pilih</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">NISN / ID</th>
                    <th className="py-3 px-4">Jurusan / Konsentrasi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Memuat data siswa...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => {
                      const isSelected = selectedStudentIds.includes(std.id);
                      let majorDisplay = "-";
                      if (typeof std.majority === "object" && std.majority !== null) majorDisplay = (std.majority as any).name;
                      else if (std.majority) majorDisplay = std.majority;

                      return (
                        <tr
                          key={std.id}
                          onClick={() => handleToggleSelectStudent(std)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-cyan-500/[0.08]" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(std)}
                              className="rounded border-white/20 text-cyan-500 focus:ring-cyan-400 bg-slate-900 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                                <AvatarImage src={getAvatarUrl(std.image || std.avatar || std.avatarUrl)} alt={std.name} />
                                <AvatarFallback className="bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                                  {getInitials(std.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-white">{std.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{std.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-cyan-400 font-medium">
                            {std.studentId || std.nim || std.nisn || "-"}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {majorDisplay}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenPreviewForStudent(std)}
                              disabled={!courseId}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Pratinjau Sertifikat Siswa Ini"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Interactive Batch Score Table & Individual Customization */}
          {selectedStudentIds.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6 shadow-xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    Tabel Penyesuaian Nilai Batch ({selectedStudentIds.length} Siswa Terpilih)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guru dapat menyesuaikan nilai siswa secara spesifik per siswa atau menggunakan tombol pengisian cepat di sebelah kanan.
                  </p>
                </div>

                {/* Quick Fill Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => handleBulkQuickFillAllStudents("90.00")}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30 transition-all"
                  >
                    Semua 90.00
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkQuickFillAllStudents("85.00")}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30 transition-all"
                  >
                    Semua 85.00
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkQuickFillAllStudents("95.00")}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-cyan-300 border border-cyan-500/30 transition-all"
                  >
                    Semua 95.00
                  </button>
                </div>
              </div>

              {/* Dynamic Batch Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 max-h-[460px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/10 z-10">
                    <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">No</th>
                      <th className="py-3 px-4 min-w-[200px]">Nama Siswa</th>
                      {pageMode === "DOUBLE" ? (
                        activeTranscriptUnits.map((u) => (
                          <th key={u.code} className="py-3 px-3 min-w-[130px] text-center font-mono text-[10px]">
                            {u.code}
                          </th>
                        ))
                      ) : (
                        <th className="py-3 px-4 text-center">Status Kelulusan</th>
                      )}
                      <th className="py-3 px-4 text-center w-28">Rata-Rata</th>
                      <th className="py-3 px-4 text-right w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedStudentIds.map((sId, idx) => {
                      const std = allStudents.find((s) => s.id === sId);
                      if (!std) return null;
                      const record = batchScores[sId] || { student: std, scores: {} };
                      const avg = getStudentAverageScore(sId);

                      return (
                        <tr key={sId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-white truncate">{std.name}</p>
                            <p className="text-[10px] font-mono text-cyan-400">{std.studentId || std.nim || std.nisn || "-"}</p>
                          </td>

                          {pageMode === "DOUBLE" ? (
                            activeTranscriptUnits.map((u) => {
                              const scoreVal = u.code && record.scores[u.code] !== undefined ? record.scores[u.code] : "90.00";

                              return (
                                <td key={u.code} className="py-3 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={scoreVal}
                                    onChange={(e) => u.code && handleUpdateStudentUnitScore(sId, u.code, e.target.value)}
                                    className="w-20 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold text-center focus:border-amber-400 focus:outline-none"
                                  />
                                </td>
                              );
                            })
                          ) : (
                            <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                              KOMPETEN (LULUS)
                            </td>
                          )}

                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">
                            {avg}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPreviewForStudent(std)}
                                className="p-2 text-cyan-400 hover:text-cyan-300 rounded-lg hover:bg-white/10 transition-colors"
                                title="Pratinjau Sertifikat"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleSelectStudent(std)}
                                className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Hapus dari Batch"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Batch Issuance Bottom Bar */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-300 font-medium">
                    Total <b>{selectedStudentIds.length} sertifikat</b> siap diterbitkan & dikunci ke ledger blockchain.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStudentIds.length > 0) {
                        const firstStd = allStudents.find((s) => s.id === selectedStudentIds[0]);
                        if (firstStd) handleOpenPreviewForStudent(firstStd);
                      }
                    }}
                    className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Pratinjau Duplex Sample
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteIssue}
                    disabled={loadingIssue}
                    className="flex-1 sm:flex-initial px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider transform active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loadingIssue ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Menerbitkan {batchProgress?.current || 0}/{batchProgress?.total || 0}...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Terbitkan {selectedStudentIds.length} Sertifikat Massal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODE SINGLE: QUICK SEARCH & INDIVIDUAL ISSUANCE --- */}
      {issueMode === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="text-cyan-400" size={18} />
              Cari Siswa (NISN / ID)
            </h3>

            <form onSubmit={handleSingleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 ml-1">
                  Nomor Induk Siswa (NIS / NISN)
                </label>
                <div className="relative">
                  <input
                    value={searchStudentId}
                    onChange={(e) => setSearchStudentId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-4 py-3 text-white focus:border-cyan-400 focus:outline-none transition-all placeholder:text-slate-600 text-xs"
                    placeholder="Contoh: 0123456768 atau NIM..."
                    autoFocus
                  />
                  <Hash className="absolute left-4 top-3.5 text-slate-500" size={16} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingSearch || !searchStudentId.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                {loadingSearch ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                {loadingSearch ? "Mencari di Database..." : "Cari Data Siswa"}
              </button>
            </form>

            {searchError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}

            {foundStudent && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-center">
                <CheckCircle className="text-emerald-400 shrink-0" size={22} />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-emerald-400">Siswa Ditemukan</h4>
                  <p className="text-xs text-white truncate font-medium">{foundStudent.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="text-fuchsia-400" size={18} />
              Detail Data Sertifikat Siswa
            </h3>

            {foundStudent ? (
              <div className="space-y-6">
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
                      {typeof foundStudent.studyProgram === "object"
                        ? (foundStudent.studyProgram as any)?.name
                        : foundStudent.studyProgram || foundStudent.majority || "Teknik Informatika"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Satuan Pendidikan / Sekolah Asal
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

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenPreviewForStudent(foundStudent)}
                    disabled={!courseId}
                    className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-fuchsia-500/20 flex items-center justify-center gap-2 transform active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                  >
                    <Award size={16} />
                    Pratinjau & Terbitkan Sertifikat
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl text-slate-500 text-xs">
                Cari siswa di kolom sebelah kiri untuk mengonfigurasi dan menerbitkan sertifikat individual.
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      )}

      {/* --- DUAL TAB PREVIEW MODAL (FRONT & TRANSCRIPT) --- */}
      {showModal && activeTargetStudent && (
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
                    Pratinjau: {activeTargetStudent.name} ({pageMode === "DOUBLE" ? "2 Halaman Duplex" : "1 Halaman"})
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm ({layoutSettings.certificatePaperSize || "A4"})
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Periksa seluruh data nama, nilai kompetensi, tanda tangan digital, dan posisi visual sebelum dicetak ke ledger blockchain.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                {/* Zoom Controls Toolbar (5% increments) */}
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
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(100)}
                    className="px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-cyan-400 rounded transition-colors"
                  >
                    100%
                  </button>
                </div>

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
                      <span>Halaman 1</span>
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

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
                >
                  <X size={18} />
                </button>
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
                      studentName={activeTargetStudent.name}
                      studentId={activeTargetStudent.studentId || activeTargetStudent.nim || activeTargetStudent.nisn || activeTargetStudent.id}
                      courseName={selectedCourse?.title || "Program Keahlian"}
                      program={typeof activeTargetStudent.studyProgram === "object" ? (activeTargetStudent.studyProgram as any)?.name : activeTargetStudent.studyProgram || selectedCourse?.title || "Program Keahlian"}
                      majority={typeof activeTargetStudent.majority === "object" ? (activeTargetStudent.majority as any)?.name : activeTargetStudent.majority || "Teknik Informatika"}
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
                      studentName={activeTargetStudent.name}
                      studentId={activeTargetStudent.studentId || activeTargetStudent.nim || activeTargetStudent.nisn || activeTargetStudent.id}
                      majority={typeof activeTargetStudent.majority === "object" ? (activeTargetStudent.majority as any)?.name : activeTargetStudent.majority || "Teknik Komputer dan Jaringan"}
                      program={typeof activeTargetStudent.studyProgram === "object" ? (activeTargetStudent.studyProgram as any)?.name : activeTargetStudent.studyProgram || selectedCourse?.title}
                      courseTitle={selectedCourse?.title}
                      units={targetStudentUnits}
                      averageScore={targetAvgScore}
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
                <span>💡 Gunakan <b>Ctrl + Scroll Mouse</b> untuk zoom cepat (kelipatan 5%).</span>
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
                Tutup Pratinjau
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExecuteIssue}
                  disabled={loadingIssue}
                  className="px-7 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {loadingIssue ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Memproses Penerbitan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>
                        {issueMode === "batch"
                          ? `Terbitkan ${selectedStudentIds.length} Sertifikat Sekarang`
                          : "Terbitkan Sertifikat Siswa Ini"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PRE-ISSUED BLOCKCHAIN SUCCESS PROOF MODAL --- */}
      {preIssuedSuccessResult && (() => {
        const certId =
          preIssuedSuccessResult.certId ||
          preIssuedSuccessResult.record?.certId ||
          preIssuedSuccessResult.record?.id ||
          preIssuedSuccessResult.certificate?.certId;
        const studentName =
          preIssuedSuccessResult.record?.studentName ||
          preIssuedSuccessResult.record?.name ||
          preIssuedSuccessResult.name ||
          preIssuedStudent?.name ||
          "Peserta Didik";
        const certNumber =
          preIssuedSuccessResult.record?.certificateNumber ||
          preIssuedSuccessResult.certificateNumber ||
          preIssuedCertNumber;
        const schoolName =
          preIssuedSuccessResult.record?.schoolName ||
          preIssuedSuccessResult.schoolName ||
          preIssuedSchoolName;
        const txHash =
          preIssuedSuccessResult.txId ||
          preIssuedSuccessResult.record?.blockchainTxId ||
          preIssuedSuccessResult.record?.txId ||
          "TX_FABRIC_ON_CHAIN";
        const fileHash =
          preIssuedSuccessResult.hash ||
          preIssuedSuccessResult.record?.hash ||
          "SHA256_MATCHED";
        const frontUrl =
          preIssuedSuccessResult.frontUrl ||
          preIssuedSuccessResult.record?.frontUrl ||
          preIssuedSuccessResult.cid ||
          preIssuedSuccessResult.record?.cid;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 flex flex-col shadow-[0_0_60px_rgba(16,185,129,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] -z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 blur-[80px] -z-10 pointer-events-none" />

              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Sertifikat Jadi Berhasil Diamankan!
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        On-Chain Verified
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Stamp Tipe A 1:1 QR code dan identitas dokumen telah resmi terikat ke ledger.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreIssuedSuccessResult(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="py-5 space-y-4 text-xs">
                {/* Recipient & Cert Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-white/10">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Nama Peserta Didik</p>
                    <p className="text-sm font-bold text-white mt-0.5">{studentName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Nomor Sertifikat Resmi</p>
                    <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{certNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">ID Verifikasi Sistem</p>
                    <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{certId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Satuan Pendidikan</p>
                    <p className="text-xs text-slate-300 truncate mt-0.5">{schoolName}</p>
                  </div>
                </div>

                {/* Cryptographic Proof Details */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <Hash size={13} className="text-cyan-400" />
                        Transaction ID (Hyperledger Fabric):
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (txHash && typeof navigator !== "undefined") {
                            navigator.clipboard?.writeText(txHash);
                          }
                          setPreIssuedCopiedHash(true);
                          setTimeout(() => setPreIssuedCopiedHash(false), 2000);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px]"
                      >
                        {preIssuedCopiedHash ? <Check size={12} /> : <Copy size={12} />}
                        <span>{preIssuedCopiedHash ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                    <p className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-cyan-300 break-all border border-cyan-500/20">
                      {txHash}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        SHA-256 Document Hash (Fingerprint):
                      </span>
                    </div>
                    <p className="p-2.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 break-all border border-white/5">
                      {fileHash}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPreIssuedSuccessResult(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Tutup Jendela
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {frontUrl && (
                    <a
                      href={frontUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Unduh Gambar Bertanda</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <a
                    href={`/verify/${certId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <span>Buka Verifikasi</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- STANDARD BATCH / SINGLE ISSUANCE SUCCESS MODAL --- */}
      {standardSuccessResults && standardSuccessResults.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.25)] relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[80px] -z-10 pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {standardSuccessResults.length} Sertifikat Berhasil Diterbitkan!
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Consensus Verified
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data siswa dan bukti konsensus blockchain telah aktif dan siap diverifikasi secara publik.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStandardSuccessResults(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body: List of issued certs */}
            <div className="py-5 overflow-y-auto space-y-3 custom-scrollbar">
              {standardSuccessResults.map((certItem, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/30 transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      <span>{certItem.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                        {certItem.certId}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      NISN: {certItem.studentId} · No: {certItem.certificateNumber || "-"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/verify/${certItem.certId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                    >
                      <span>Verifikasi Publik</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500">
                Total: <b>{standardSuccessResults.length}</b> sertifikat tercatat
              </span>
              <button
                type="button"
                onClick={() => setStandardSuccessResults(null)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
