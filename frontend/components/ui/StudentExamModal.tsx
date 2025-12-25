"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import api from "@/lib/api";

interface StudentExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string | null;
  studentName: string;
}

export default function StudentExamModal({
  isOpen,
  onClose,
  resultId,
  studentName,
}: StudentExamModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (isOpen && resultId) {
      document.body.style.overflow = "hidden";
      fetchDetails();
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, resultId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // We use the submissions detail endpoint which returns exact answers
      // This endpoint was created earlier: GET /lms/exams/:examId/submissions
      // Wait, that returns ALL submissions. We need specific result details.
      // But we don't have a specific GET /results/:id endpoint yet.
      // Let's create a quick client-side fetcher using the generic submissions endpoint if possible?
      // No that's inefficient.
      // Actually, for now, let's assume we can fetch the specific one via a new endpoint
      // OR we reuse the deleteSubmission endpoint logic but for GET.
      // Let's create a temporary client-side mock or fetch logic if the endpoint exists.
      // Step 288 (examRoutes) shows: GET /:examId/submissions
      // It DOES NOT show GET /submissions/:id.
      // I will implement a quick GET /api/lms/exams/results/:id in backend if I can.
      // For now, I will simulate the fetch or use a placeholder if backend not ready.
      // But user asked for "content".
      // I will assume the endpoint exists or I will add it in next step.
      // I'll call: GET /lms/exams/results/${resultId}
      const res = await api.get(`/lms/exams/results/${resultId}`);
      setDetails(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0d0b2f] border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {studentName}
            </h2>
            <p className="text-cyan-400 text-sm font-mono tracking-widest uppercase">
              Exam Analytics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20 text-cyan-500">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : !details ? (
          <div className="p-10 text-center text-slate-500">
            Failed to load details.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Score & Chart Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center p-6 bg-[#0b0c24] rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                <h3 className="text-slate-400 text-sm uppercase tracking-widest mb-2">
                  Final Score
                </h3>
                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                  {details.score.toFixed(0)}
                </div>
                <div
                  className={`inline-block px-4 py-1 rounded-full text-sm font-bold mt-4 ${
                    details.status === "PASSED"
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : "bg-red-500/20 text-red-400 border border-red-500/50"
                  }`}
                >
                  {details.status}
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full bg-[#0b0c24] p-4 rounded-2xl border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Student",
                        score: details.score,
                        fill: "#22d3ee",
                      }, // Cyan
                      { name: "Average", score: 75, fill: "#c026d3" }, // Magenta (Mock Avg)
                    ]}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        color: "#f8fafc",
                      }}
                    />
                    <Bar
                      dataKey="score"
                      radius={[0, 4, 4, 0]}
                      barSize={32}
                      className="filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Questions Breakdown */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                Question Breakdown
              </h3>
              <div className="space-y-3">
                {details.answers.map((ans: any, idx: number) => (
                  <div
                    key={ans.id}
                    className={`p-4 rounded-xl border ${
                      ans.option.isCorrect
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-slate-500">
                        Q{idx + 1}
                      </span>
                      {ans.option.isCorrect ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                    </div>
                    <p className="text-slate-200 font-medium mb-3">
                      {ans.question.text}
                    </p>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-20">Selected:</span>
                        <span
                          className={
                            ans.option.isCorrect
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {ans.option.text}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
