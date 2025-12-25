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
import { Trash2, Search, User, Filter } from "lucide-react";
import { MAJORITIES, getProgramsByMajor } from "@/lib/constants/academics";

export default function StudentManagementPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [kicking, setKicking] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/lms/courses/${courseId}/students`);
      if (res.data.ok) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error(err);
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
      // Remove from list locally
      setStudents((prev) =>
        prev.filter((s) => s.user.id !== selectedStudent.user.id)
      );
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove student");
    } finally {
      setKicking(false);
    }
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:4000${path}`;
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch =
      s.user.name.toLowerCase().includes(term) ||
      s.user.nim?.toLowerCase().includes(term) ||
      s.user.email.toLowerCase().includes(term);

    const matchesMajor =
      selectedMajor === "All Majors" || s.user.majority === selectedMajor;
    const matchesProgram =
      selectedProgram === "All Programs" ||
      s.user.studyProgram?.includes(selectedProgram);

    return matchesSearch && matchesMajor && matchesProgram;
  });

  return (
    <div className="space-y-6">
      {/* ... header ... */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Enrolled Students
          </h1>
          <p className="text-slate-400 text-sm">
            Manage access and view student progress.
          </p>
        </div>
        <div className="bg-teal-500/10 border border-teal-500/30 px-4 py-2 rounded-lg text-teal-400 font-mono font-bold">
          TOTAL: {students.length}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, NIM, or email..."
            className="w-full bg-[#0d0b2f] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-teal-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-slate-500"
              size={16}
            />
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedProgram("All Programs");
              }}
              className="appearance-none bg-[#0d0b2f] border border-slate-700 rounded-xl py-2.5 pl-10 pr-8 text-white focus:border-teal-500 focus:outline-none cursor-pointer text-sm min-w-[160px]"
            >
              <option value="All Majors">All Majors</option>
              {MAJORITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-slate-500"
              size={16}
            />
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="appearance-none bg-[#0d0b2f] border border-slate-700 rounded-xl py-2.5 pl-10 pr-8 text-white focus:border-teal-500 focus:outline-none cursor-pointer text-sm min-w-[160px]"
            >
              <option value="All Programs">All Programs</option>
              {getProgramsByMajor(selectedMajor).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-10 animate-pulse">
          Loading student data...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
          <User className="mx-auto text-slate-700 mb-3" size={32} />
          <p className="text-slate-500">
            No students found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d0b2f]/50">
          <table className="w-full text-left text-sm text-slate-400 min-w-[800px]">
            <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-300">
              <tr>
                <th className="px-6 py-4">Student Identity</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Enrolled At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStudents.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                        {enrollment.user.avatar ? (
                          <img
                            src={getAvatarUrl(enrollment.user.avatar)!}
                            alt={enrollment.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          enrollment.user.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {enrollment.user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {enrollment.user.email} •{" "}
                          {enrollment.user.nim || "No NIM"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-300 font-medium">
                        {enrollment.user.studyProgram || "-"}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {enrollment.user.majority || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleKick(enrollment)}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Remove Student"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#0d0b2f] border border-teal-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove{" "}
              <span className="text-white font-bold">
                {selectedStudent?.user.name}
              </span>{" "}
              from this course? This action cannot be undone and their progress
              will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmKick}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {kicking ? "Removing..." : "Yes, Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
