"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Target,
  Filter,
  FileSpreadsheet,
  Trash2,
  Users,
  Trophy,
  History,
  ChevronRight,
} from "lucide-react";
import MultiSelectFilter from "@/components/ui/MultiSelectFilter";
import StudentExamModal from "@/components/ui/StudentExamModal";
import { toast } from "sonner";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";
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
import { getAvatarUrl } from "@/lib/utils";

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
  resultId: string | null;
}

const STATUS_OPTIONS = [
  { label: "PASSED", value: "PASSED" },
  { label: "FAILED", value: "FAILED" },
  { label: "NOT STARTED", value: "NOT_STARTED" },
];

const SCORE_OPTIONS = [
  { label: "High Pass (>80)", value: "high" },
  { label: "Standard (50-80)", value: "mid" },
  { label: "Low Score (<50)", value: "low" },
];

export default function ExamResultsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentResult[]>([]);
  const [filteredData, setFilteredData] = useState<StudentResult[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  const [selectedResult, setSelectedResult] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resultToDelete, setResultToDelete] = useState<{
    id: string;
    studentName: string;
  } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    if (courseId) loadResults();
  }, [courseId]);

  useEffect(() => {
    applyFilters();
  }, [data, search, statusFilter, scoreFilter, selectedMajor, selectedProgram]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/exams/course/${courseId}/results`);
      if (res.data.ok) setData(res.data.data);
    } catch (error) {
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...data];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.student.name.toLowerCase().includes(q) ||
          item.student.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter.length > 0)
      result = result.filter((item) => statusFilter.includes(item.status));
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
    if (selectedMajor !== "All Majors") {
      result = result.filter((item) => {
        const majName =
          typeof item.student.majority === "object"
            ? item.student.majority?.name
            : item.student.majority || "";
        return majName === selectedMajor;
      });
    }
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

  const handleExportGrades = async () => {
    try {
      const examRes = await api.get(`/lms/courses/${courseId}/exam`);
      const examId = examRes.data.data?.id;
      if (!examId) return toast.error("Assessment records not found");

      const response = await api.get(`/lms/exams/${examId}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Assessment_Results.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const executeDeleteResult = async () => {
    if (!resultToDelete) return;
    try {
      const res = await api.delete(
        `/lms/exams/submissions/${resultToDelete.id}`
      );
      if (res.data.ok) {
        toast.success("Assessment records reset");
        setResultToDelete(null);
        loadResults();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Reset failed");
    }
  };

  if (loading && data.length === 0)
    return <CyberpunkLoader text="Loading Assessment Data" />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            Assessment Analytics
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em] mt-1">
            Student Progress Overview
          </p>
        </div>
        <button
          onClick={handleExportGrades}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-black uppercase tracking-widest rounded transition-all"
        >
          <FileSpreadsheet size={16} /> Download Report
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Filter by Student Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MultiSelectFilter
            label="Status"
            options={STATUS_OPTIONS}
            selectedValues={statusFilter}
            onChange={setStatusFilter}
          />
          <MultiSelectFilter
            label="Score Range"
            options={SCORE_OPTIONS}
            selectedValues={scoreFilter}
            onChange={setScoreFilter}
          />

          <div className="w-px h-8 bg-white/5 mx-1 hidden lg:block" />

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
              className="appearance-none bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-[10px] font-black text-white hover:border-white/20 transition-all focus:border-cyan-500/50 outline-none cursor-pointer uppercase tracking-widest min-w-[180px]"
            >
              <option value="All Programs">All Programs</option>
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

        <div className="ml-auto flex items-center gap-4">
          <div className="flex flex-col items-end px-4 border-r border-white/5">
            <span className="text-[10px] font-black text-white tracking-widest">
              {filteredData.length}
            </span>
            <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
              Records Found
            </span>
          </div>
          <Target className="text-white/10" size={24} />
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white/[0.03] text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-5">Student Detail</th>
                <th className="px-6 py-5">Course Module</th>
                <th className="px-6 py-5">Achievement</th>
                <th className="px-6 py-5">Top Score</th>
                <th className="px-6 py-5 text-right">Attempts</th>
                <th className="px-8 py-5 text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredData.map((row) => (
                <tr
                  key={row.student.id}
                  className="hover:bg-cyan-500/[0.02] transition-colors group cursor-pointer border-l-2 border-transparent hover:border-cyan-500/50"
                  onClick={() => {
                    if (row.hasAttempt && row.resultId) {
                      setSelectedResult({
                        id: row.resultId,
                        name: row.student.name,
                      });
                    } else {
                      toast("Student has not yet completed any assessments.");
                    }
                  }}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={
                            getAvatarUrl(row.student.avatar) ||
                            `https://ui-avatars.com/api/?name=${row.student.name}&background=random&color=fff`
                          }
                          alt={row.student.name}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-cyan-500/50 transition-all group-hover:scale-105"
                        />
                        {row.status === "PASSED" && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black flex items-center justify-center">
                            <CheckCircle size={10} className="text-black" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                          {row.student.name}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono tracking-tighter mt-0.5">
                          {row.student.email.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-wider line-clamp-1 max-w-[200px]">
                        {typeof row.student.program === "object"
                          ? row.student.program?.name
                          : row.student.program || "Not Set"}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono uppercase mt-1 tracking-widest">
                        {typeof row.student.majority === "object"
                          ? row.student.majority?.name
                          : row.student.majority || "General"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {row.status === "PASSED" && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-[9px] font-black border border-green-500/20 uppercase tracking-widest">
                          <Trophy size={10} /> Passed
                        </span>
                      )}
                      {row.status === "FAILED" && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-[9px] font-black border border-fuchsia-500/20 uppercase tracking-widest">
                          <AlertCircle size={10} /> Failed
                        </span>
                      )}
                      {row.status === "NOT_STARTED" && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 text-slate-500 text-[9px] font-black border border-white/10 uppercase tracking-widest">
                          <History size={10} /> Not Started
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full transition-all duration-700 ${
                            row.bestScore >= 80
                              ? "bg-green-500"
                              : row.bestScore >= 50
                              ? "bg-yellow-500"
                              : "bg-fuchsia-500"
                          }`}
                          style={{
                            width: `${row.hasAttempt ? row.bestScore : 0}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`font-mono text-xs font-black ${
                          row.bestScore >= 80
                            ? "text-green-400"
                            : row.bestScore >= 50
                            ? "text-yellow-400"
                            : row.bestScore > 0
                            ? "text-fuchsia-400"
                            : "text-slate-700"
                        }`}
                      >
                        {row.hasAttempt
                          ? `${row.bestScore.toFixed(0)}%`
                          : "00%"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white font-mono text-xs px-2.5 py-1 bg-white/5 rounded-md border border-white/10 group-hover:border-cyan-500/30 transition-all">
                      {String(row.attemptsCount).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-6">
                      <div className="text-right">
                        <p className="text-[10px] text-white font-mono uppercase font-black tracking-tighter">
                          {row.lastAttemptAt
                            ? new Date(row.lastAttemptAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "--/--/--"}
                        </p>
                        <p className="text-[8px] text-slate-600 font-mono mt-0.5 uppercase tracking-widest">
                          {row.lastAttemptAt
                            ? new Date(row.lastAttemptAt).toLocaleTimeString(
                                undefined,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                }
                              )
                            : "00:00:00"}
                        </p>
                      </div>

                      {row.hasAttempt && row.resultId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResultToDelete({
                              id: row.resultId!,
                              studentName: row.student.name,
                            });
                          }}
                          className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Reset Assessment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <ChevronRight
                        size={18}
                        className="text-white/10 group-hover:text-cyan-500 transition-colors"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StudentExamModal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        resultId={selectedResult?.id || null}
        studentName={selectedResult?.name || ""}
      />

      <AlertDialog
        open={!!resultToDelete}
        onOpenChange={(open: boolean) => !open && setResultToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0b0c24] border border-white/10 text-white rounded-3xl shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Reset Student Assessment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              You are about to reset the assessment record for{" "}
              <span className="text-white font-black">
                {resultToDelete?.studentName}
              </span>
              . This will remove their current score and allow them to take the
              assessment again. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em]">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all rounded-xl py-3 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteResult}
              className="bg-fuchsia-500/20 border border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white rounded-xl transition-all py-3 px-6"
            >
              Confirm Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
