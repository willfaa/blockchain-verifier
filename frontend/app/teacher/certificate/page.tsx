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
import { getInitials } from "@/lib/utils";

export default function SmartIssueCertificatePage() {
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingIssue, setLoadingIssue] = useState(false);

  // Search State
  const [searchNim, setSearchNim] = useState("");
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
    if (!searchNim) return;

    setLoadingSearch(true);
    setSearchError(null);
    setFoundStudent(null);

    try {
      // Panggil API Backend yang baru dibuat: /lms/students/:nim
      // Note: Di backend route-nya tadi /students/:nim ada di lmsRoutes which is prefixed by /api/lms probably?
      // Cek lmsRoutes definition di server.ts/index.ts. Biasanya app.use('/lms', lmsRoutes).
      // Kita coba path: /lms/students/{nim}
      const res = await api.get(`/lms/students/${searchNim}`);
      if (res.data.ok) {
        setFoundStudent(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(
        err.response?.data?.error || "Student not found or server error"
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
        nim: foundStudent.nim,
        program: foundStudent.program,
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
      setSearchNim("");
      setCourseId("");
    } catch (err: any) {
      toast.error(
        "Issue Failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoadingIssue(false);
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
                  Student NIM
                </label>
                <div className="relative">
                  <input
                    value={searchNim}
                    onChange={(e) => setSearchNim(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 pl-11 pr-4 py-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
                    placeholder="e.g. 1805097..."
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
                disabled={loadingSearch || !searchNim}
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
                  <p className="text-xs text-white">Enter NIM to start</p>
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
                      src={
                        foundStudent?.avatar
                          ? foundStudent.avatar.startsWith("http")
                            ? foundStudent.avatar
                            : `${
                                process.env.NEXT_PUBLIC_API_URL ||
                                "http://localhost:4000"
                              }${foundStudent.avatar}`
                          : ""
                      }
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
                  NIM
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                  <Hash size={18} className="text-cyan-400" />
                  <span className="font-mono text-slate-300">
                    {foundStudent?.nim || "..."}
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
                    {foundStudent?.program || "..."}
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
                  onClick={handleIssue}
                  disabled={!foundStudent || loadingIssue}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingIssue ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Signing & Minting...
                    </>
                  ) : (
                    <>
                      <Award size={18} />
                      Issue Certificate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
