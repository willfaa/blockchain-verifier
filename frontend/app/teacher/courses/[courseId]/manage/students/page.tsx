"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
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
import {
  Trash2,
  Search,
  User,
  Filter,
  Users,
  X,
  ShieldAlert,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { MAJORITIES, getProgramsByMajor } from "@/lib/constants/academics";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";
import { getAvatarUrl } from "@/lib/utils";

export default function StudentManagementPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [kicking, setKicking] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}/students`);
      if (res.data.ok) setStudents(res.data.data);
    } catch (err) {
      toast.error("Failed to sync personnel log");
    } finally {
      setLoading(false);
    }
  };

  const handleKick = (student: any) => {
    setSelectedStudent(student);
    setConfirmOpen(true);
  };

  const confirmKick = async () => {
    if (!selectedStudent) return;
    setKicking(true);
    try {
      await api.delete(
        `/lms/courses/${courseId}/students/${selectedStudent.user.id}`
      );
      setStudents((prev) =>
        prev.filter((s) => s.user.id !== selectedStudent.user.id)
      );
      setConfirmOpen(false);
      toast.success("Student removed from course");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Purge protocol failed");
    } finally {
      setKicking(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      s.user.name.toLowerCase().includes(term) ||
      s.user.studentId?.toLowerCase().includes(term) ||
      s.user.email.toLowerCase().includes(term);

    const matchesMajor =
      selectedMajor === "All Majors" || s.user.majority === selectedMajor;
    const matchesProgram =
      selectedProgram === "All Programs" ||
      s.user.studyProgram?.includes(selectedProgram);

    return matchesSearch && matchesMajor && matchesProgram;
  });

  if (loading && students.length === 0)
    return <CyberpunkLoader text="Loading Student Records..." />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            Personnel_Grid
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em] mt-1">
            Access_Management_Interface
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col items-end border-r border-white/10 pr-4">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Active_Nodes
            </span>
            <span className="text-xl font-black text-white tabular-nums">
              {students.length}
            </span>
          </div>
          <Users size={24} className="text-cyan-500 opacity-50" />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Student Name, ID, or Email..."
            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedProgram("All Programs");
              }}
              className="appearance-none bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-[10px] font-black text-white hover:border-white/20 transition-all focus:border-cyan-500/50 outline-none cursor-pointer uppercase tracking-widest"
            >
              <option value="All Majors">All Majors</option>
              {MAJORITIES.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-cyan-500 transition-colors">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          <div className="relative group">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="appearance-none bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-[10px] font-black text-white hover:border-white/20 transition-all focus:border-cyan-500/50 outline-none cursor-pointer uppercase tracking-widest min-w-[200px]"
            >
              <option value="All Programs">ALL_CORE_PROGRAMS</option>
              {getProgramsByMajor(selectedMajor).map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-cyan-500 transition-colors">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.03] text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-6">Student Information</th>
                <th className="px-6 py-6">Logic_Allocation</th>
                <th className="px-6 py-6">Enrollment Date</th>
                <th className="px-8 py-6 text-right">Access_Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredStudents.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="hover:bg-cyan-500/[0.02] transition-colors group border-l-2 border-transparent hover:border-cyan-500/50"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative group-hover:scale-105 transition-transform">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-white font-black text-sm overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                          {enrollment.user.avatar ? (
                            <img
                              src={getAvatarUrl(enrollment.user.avatar)}
                              alt={enrollment.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Terminal size={18} className="text-white/20" />
                          )}
                        </div>
                        <div className="absolute -inset-1 bg-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div>
                        <div className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                          {enrollment.user.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter mt-1">
                          {enrollment.user.email.toUpperCase()} •{" "}
                          {enrollment.user.studentId || "ID_PENDING"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">
                        {enrollment.user.studyProgram || "UNSPECIFIED"}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono uppercase mt-1 tracking-widest">
                        {enrollment.user.majority || "GENERAL_OP"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono font-black text-slate-400 uppercase">
                        {new Date(enrollment.enrolledAt).toLocaleDateString(
                          undefined,
                          { day: "2-digit", month: "short", year: "numeric" }
                        )}
                      </span>
                      <span className="text-[8px] text-slate-600 font-mono mt-0.5">
                        REGISTERED_SYNC
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => handleKick(enrollment)}
                      className="p-3 text-white/10 hover:text-fuchsia-500 hover:bg-fuchsia-500/10 rounded-xl transition-all border border-transparent hover:border-fuchsia-500/30"
                      title="Purge Access"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#0b0c24] border border-white/10 text-white rounded-[2rem] shadow-2xl backdrop-blur-xl max-w-md">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-500 mb-6 mx-auto">
              <ShieldAlert size={32} />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-center">
              Remove Student Record
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium text-center">
              Are you sure you want to purge{" "}
              <span className="text-white font-black">
                {selectedStudent?.user.name}
              </span>{" "}
              from this course? Their progress records will be removed and
              access tokens revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3 font-mono text-[9px] uppercase tracking-[0.2em] w-full">
            <AlertDialogCancel className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all rounded-xl py-4">
              Abort_Purge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmKick}
              className="flex-1 bg-fuchsia-500/20 border border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white rounded-xl transition-all py-4"
            >
              {kicking ? "PURGING..." : "Confirm_Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
