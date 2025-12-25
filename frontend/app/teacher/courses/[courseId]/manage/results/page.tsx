"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  LayoutGrid,
  Filter,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";
import StudentExamModal from "@/components/ui/StudentExamModal";
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
import { MAJORITIES, getProgramsByMajor } from "@/lib/constants/academics";

// Interfaces
interface StudentResult {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    program?: { name: string } | string;
    majority?: { name: string } | string;
  };
  hasAttempt: boolean;
  attemptsCount: number;
  bestScore: number;
  status: "PASSED" | "FAILED" | "NOT_STARTED";
  lastAttemptAt: string | null;
  isPassed: boolean;
  resultId: string | null;
}

const STATUS_OPTIONS = [
  { label: "Passed", value: "PASSED" },
  { label: "Failed", value: "FAILED" },
  { label: "Not Started", value: "NOT_STARTED" },
];

const SCORE_OPTIONS = [
  { label: "High (>80)", value: "high" },
  { label: "Mid (50-80)", value: "mid" },
  { label: "Low (<50)", value: "low" },
];

export default function ExamResultsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentResult[]>([]);
  const [filteredData, setFilteredData] = useState<StudentResult[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  // Modal State
  const [selectedResult, setSelectedResult] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (courseId) {
      loadResults();
    }
  }, [courseId]);

  useEffect(() => {
    applyFilters();
  }, [data, search, statusFilter, scoreFilter, selectedMajor, selectedProgram]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/exams/course/${courseId}/results`);
      if (res.data.ok) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...data];

    // 1. Search (Name or Email)
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.student.name.toLowerCase().includes(q) ||
          item.student.email.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter.length > 0) {
      result = result.filter((item) => statusFilter.includes(item.status));
    }

    // 3. Score Filter
    if (scoreFilter.length > 0) {
      result = result.filter((item) => {
        const s = item.bestScore;
        return scoreFilter.some((range) => {
          if (range === "high") return s >= 80;
          if (range === "mid") return s >= 50 && s < 80;
          if (range === "low") return s < 50;
          return false;
        });
      });
    }

    // 4. Major Filter
    if (selectedMajor !== "All Majors") {
      result = result.filter((item) => {
        const majName =
          typeof item.student.majority === "object"
            ? item.student.majority?.name
            : item.student.majority || "";
        return majName === selectedMajor;
      });
    }

    // 5. Program Filter
    if (selectedProgram !== "All Programs") {
      result = result.filter((item) => {
        const progName =
          typeof item.student.program === "object"
            ? item.student.program?.name
            : item.student.program || "";
        return progName && progName.includes(selectedProgram);
      });
    }

    setFilteredData(result);
  };

  const getScoreColor = (score: number, hasAttempt: boolean) => {
    if (!hasAttempt) return "text-slate-500";
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return "https://ui-avatars.com/api/?background=random&color=fff";
    if (path.startsWith("http")) return path;
    return `http://localhost:4000${path}`;
  };

  const handleExportGrades = async () => {
    try {
      const examRes = await api.get(`/lms/courses/${courseId}/exam`);
      const examId = examRes.data.data?.id;

      if (!examId) {
        toast.error("No exam found for this course.");
        return;
      }

      const response = await api.get(`/lms/exams/${examId}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Exam_Grades.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Grade report downloaded!");
    } catch (error) {
      toast.error("Failed to export grades");
    }
  };

  // --- NEW: DELETE RESULT HANDLER ---
  const [resultToDelete, setResultToDelete] = useState<{
    id: string;
    studentName: string;
  } | null>(null);

  const handleDeleteResult = (
    resultId: string,
    studentName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setResultToDelete({ id: resultId, studentName });
  };

  const executeDeleteResult = async () => {
    if (!resultToDelete) return;

    try {
      // Use existing endpoint: DELETE /api/lms/exams/submissions/:id
      const res = await api.delete(
        `/lms/exams/submissions/${resultToDelete.id}`
      );
      if (res.data.ok) {
        toast.success("Exam result deleted successfully");
        setResultToDelete(null);
        loadResults();
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast.error(error.response?.data?.error || "Failed to delete result");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Exam Results</h1>
        <p className="text-slate-400">
          Monitor student performance and review submissions.
        </p>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-[#0d0b2f] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#0b0c24] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-cyan-500/50 w-full md:w-56 transition-all"
            />
          </div>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

          <MultiSelectFilter
            label="Status"
            options={STATUS_OPTIONS}
            selectedValues={statusFilter}
            onChange={setStatusFilter}
          />
          <MultiSelectFilter
            label="Score"
            options={SCORE_OPTIONS}
            selectedValues={scoreFilter}
            onChange={setScoreFilter}
          />

          <div className="hidden md:block w-[1px] h-8 bg-white/10 mx-2"></div>

          {/* New Major Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Filter size={14} />
            </div>
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedProgram("All Programs");
              }}
              className="appearance-none bg-[#0d0b2f] border border-white/10 rounded-xl py-2 pl-9 pr-8 text-white focus:border-cyan-500 focus:outline-none cursor-pointer text-sm min-w-[130px]"
            >
              <option value="All Majors">All Majors</option>
              {MAJORITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* New Program Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Filter size={14} />
            </div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="appearance-none bg-[#0d0b2f] border border-white/10 rounded-xl py-2 pl-9 pr-8 text-white focus:border-cyan-500 focus:outline-none cursor-pointer text-sm min-w-[130px]"
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

        <button
          onClick={handleExportGrades}
          className="flex items-center gap-2 px-4 py-2 bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/30 rounded-xl transition-all font-bold text-sm"
        >
          <FileSpreadsheet size={18} /> Export Excel
        </button>

        <div className="text-slate-400 text-sm font-mono hidden md:block">
          Showing{" "}
          <span className="text-white font-bold">{filteredData.length}</span>{" "}
          students
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-[#0d0b2f] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center text-cyan-500">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <LayoutGrid className="mx-auto mb-4 opacity-20" size={48} />
            <p>No results found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#0b0c24] text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="px-4 py-3 pl-6">Student</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Last</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredData.map((row) => (
                  <tr
                    key={row.student.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => {
                      if (row.hasAttempt && row.resultId) {
                        setSelectedResult({
                          id: row.resultId,
                          name: row.student.name,
                        });
                      } else {
                        toast("Student has not taken the exam yet.");
                      }
                    }}
                  >
                    <td className="px-4 py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(row.student.avatar)}
                          alt={row.student.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-cyan-500/50 transition-colors"
                        />
                        <div>
                          <p className="text-white font-bold text-sm group-hover:text-cyan-400 transition-colors">
                            {row.student.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {row.student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span
                          className="text-xs font-medium text-white line-clamp-1 max-w-[180px]"
                          title={
                            typeof row.student.program === "object"
                              ? row.student.program?.name
                              : row.student.program || ""
                          }
                        >
                          {typeof row.student.program === "object"
                            ? row.student.program?.name
                            : row.student.program || "-"}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1 max-w-[150px]">
                          {typeof row.student.majority === "object"
                            ? row.student.majority?.name
                            : row.student.majority || "General"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "PASSED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                          <CheckCircle size={12} /> Passed
                        </span>
                      )}
                      {row.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                          <XCircle size={12} /> Failed
                        </span>
                      )}
                      {row.status === "NOT_STARTED" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-bold border border-slate-500/20">
                          Not Started
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-bold text-lg ${getScoreColor(
                          row.bestScore,
                          row.hasAttempt
                        )}`}
                      >
                        {row.hasAttempt ? row.bestScore.toFixed(1) : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm font-mono bg-white/5 px-2 py-1 rounded">
                        {row.attemptsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                      {row.lastAttemptAt
                        ? new Date(row.lastAttemptAt).toLocaleDateString() +
                          " " +
                          new Date(row.lastAttemptAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>

                    {/* Action Column */}
                    <td className="px-4 py-3 text-right">
                      {row.hasAttempt && row.resultId && (
                        <button
                          onClick={(e) =>
                            handleDeleteResult(
                              row.resultId!,
                              row.student.name,
                              e
                            )
                          }
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Result (Reset)"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StudentExamModal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        resultId={selectedResult?.id || null}
        studentName={selectedResult?.name || ""}
      />

      {/* Delete Result Dialog */}
      <AlertDialog
        open={!!resultToDelete}
        onOpenChange={(open: boolean) => !open && setResultToDelete(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Exam Attempt?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete the exam result for{" "}
              <span className="text-white font-bold">
                {resultToDelete?.studentName}
              </span>
              ? This action cannot be undone. The student will be allowed to
              retake the exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteResult}
              className="bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Delete Result
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
