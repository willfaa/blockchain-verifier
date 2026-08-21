// frontend/app/teacher/certificate/page.tsx
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Award,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Hash,
  User,
  BookOpen,
  GraduationCap,
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

export default function SmartIssueCertificatePage() {
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingIssue, setLoadingIssue] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Search State
  const [searchStudentId, setSearchStudentId] = useState("");
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Form State (Autofilled + Manual)
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<any[]>([]);

  // Fetch Teacher's Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/lms/teacher/my-courses");
        if (res.data.ok) {
          setCourses(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Handler: Cari Mahasiswa
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchStudentId) return;

    setLoadingSearch(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      // Panggil API Backend yang baru dibuat: /auth/student/:studentId
      const res = await api.get(`/auth/student/${searchStudentId}`);
      if (res.data.ok) {
        setFoundStudent(res.data.student);
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(
        err.response?.data?.error || "Student not found or server error",
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  // Handler: Issue Certificate
  const handleIssue = async () => {
    if (!foundStudent) return;
    setLoadingIssue(true);

    try {
      const payload = {
        studentName: foundStudent.name,
        studentId: foundStudent.studentId,
        program: foundStudent.studyProgram || foundStudent.program,
        majority: foundStudent.majority,
        courseId: courseId || null,
        // Backend akan handle creation date & unique Cert ID
      };

      const res = await api.post("/certificates/issue", payload);

      toast.success("Certificate Issued!", {
        description: `TX Hash: ${res.data.txId || "N/A"}`,
      });
      // Reset
      setFoundStudent(null);
      setSearchStudentId("");
      setCourseId("");
      setShowModal(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error(
        "Issue Failed: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setLoadingIssue(false);
    }
  };

  const handlePreview = async () => {
    if (!foundStudent) return;
    setLoadingPreview(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    
    try {
      const payload = {
        name: foundStudent.name,
        studentId: foundStudent.studentId,
        program: foundStudent.studyProgram || foundStudent.program,
        majority: foundStudent.majority,
        courseId: courseId || null,
      };

      const res = await api.post("/certificates/preview", payload, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(res.data);
      setPreviewUrl(url);
      setShowModal(true);
    } catch (err: any) {
      toast.error("Preview Failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Smart Certificate Issuance
        </h1>
        <p className="text-slate-400 mt-2">
          Find a student and issue a verifiable blockchain certificate in
          seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: SEARCH --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0d0b2f]/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-lg h-full">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="text-cyan-400" size={20} />
              Find Student
            </h3>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5 ml-1">
                  Student ID
                </label>
                <div className="relative">
                  <input
                    value={searchStudentId}
                    onChange={(e) => setSearchStudentId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 pl-11 pr-4 py-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                    placeholder="e.g. 1805097 or studentId..."
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
                disabled={loadingSearch || !searchStudentId}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center gap-2"
              >
                {loadingSearch ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Search size={18} />
                )}
                {loadingSearch ? "Searching..." : "Search Database"}
              </button>
            </form>

            {/* State Indicators */}
            <div className="mt-8">
              {searchError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                  <AlertCircle
                    className="text-red-400 shrink-0 mt-0.5"
                    size={18}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-red-400">
                      Not Found
                    </h4>
                    <p className="text-xs text-red-300 mt-1">{searchError}</p>
                  </div>
                </div>
              )}

              {foundStudent && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                  <CheckCircle className="text-green-400 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-green-400">
                      Student Found!
                    </h4>
                    <p className="text-xs text-green-300">
                      Data loaded successfully.
                    </p>
                  </div>
                </div>
              )}

              {!foundStudent && !searchError && !loadingSearch && (
                <div className="text-center py-8 opacity-40">
                  <div className="w-16 h-1 bg-white/10 rounded-full mx-auto mb-3"></div>
                  <p className="text-xs text-white">Enter Student ID to start</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: PREVIEW & ACTION --- */}
        <div className="lg:col-span-2">
          <div className="bg-[#0d0b2f]/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-lg relative overflow-hidden">
            {/* Overlay jika belum ada data */}
            {!foundStudent && (
              <div className="absolute inset-0 z-10 bg-[#0b0724]/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                  <User className="text-slate-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Waiting for Data
                </h3>
                <p className="text-slate-400 max-w-sm">
                  Search for a student on the left panel to populate the
                  certificate details automatically.
                </p>
              </div>
            )}

            {/* Header Form */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Certificate Preview
                </h3>
                <p className="text-sm text-slate-400">
                  Verify details before issuing to blockchain.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
                Draft Mode
              </div>
            </div>

            {/* Data Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarImage
                      src={getAvatarUrl(foundStudent?.avatar)}
                      alt={foundStudent?.name}
                    />
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                      {getInitials(foundStudent?.name || "Std")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-white">
                    {foundStudent?.name || "..."}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student ID
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <Hash size={18} className="text-cyan-400" />
                  <span className="font-mono text-slate-300">
                    {foundStudent?.studentId || "..."}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Major
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <BookOpen size={18} className="text-fuchsia-400" />
                  <span className="text-slate-300">
                    {foundStudent?.majority || "..."}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Program
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <GraduationCap size={18} className="text-fuchsia-400" />
                  <span className="text-slate-300">
                    {foundStudent?.studyProgram || foundStudent?.program || "..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full mb-8" />

            {/* Action Area */}
            <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
              <div className="w-full md:w-1/2">
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Select Course (Context)
                </label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-cyan-500">
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length > 0 ? (
                      courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-slate-500 text-center">
                        No courses found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-auto">
                <button
                  onClick={handlePreview}
                  disabled={!foundStudent || loadingPreview}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <Award size={18} />
                      Preview & Issue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Confirm Certificate Issuance</h3>
                <p className="text-sm text-slate-400 mt-1">Please review the visual layout before permanently minting to the blockchain.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                disabled={loadingIssue}
                className="text-slate-400 hover:text-white p-2"
              >
                Cancel
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-slate-950 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Certificate Preview" className="max-h-[60vh] max-w-full object-contain rounded-lg border border-white/5 shadow-2xl" />
              ) : (
                <Loader2 className="animate-spin text-cyan-500" size={32} />
              )}
            </div>
            
            <div className="p-6 border-t border-white/10 bg-slate-900 flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={loadingIssue}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleIssue}
                disabled={loadingIssue}
                className="px-8 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingIssue ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Signing & Minting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm & Mint
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
