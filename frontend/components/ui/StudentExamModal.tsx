"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  Target,
  History,
  Hash,
  Terminal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";

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
      const res = await api.get(`/lms/exams/results/${resultId}`);
      if (res.data.ok) setDetails(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-[#0b0c24] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Decorative Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Header */}
        <div className="relative p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Terminal size={18} className="text-cyan-500" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                {studentName}
              </h2>
            </div>
            <p className="text-slate-500 text-[10px] font-mono tracking-[0.4em] uppercase">
              //_LOGS_DECIPHERED_ENTRY_ID:[{resultId?.slice(0, 8)}]
            </p>
          </div>
          <button
            onClick={onClose}
            className="group relative p-3 rounded-2xl bg-white/5 hover:bg-fuchsia-500 transition-all duration-300"
          >
            <X
              size={20}
              className="text-white group-hover:scale-110 transition-transform"
            />
            <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-fuchsia-400 opacity-50" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 min-h-[400px]">
            <CyberpunkLoader text="Loading Analytics..." />
          </div>
        ) : !details ? (
          <div className="p-20 text-center font-mono text-fuchsia-500 uppercase tracking-widest">
            ERROR: ACCESS_DENIED_OR_DATA_CORRUPTED
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
            {/* Score & Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-white/[0.02] rounded-[2rem] border border-white/5 relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                  Final_Efficiency
                </span>

                <div className="relative">
                  <div className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    {details.score.toFixed(0)}
                  </div>
                  <span className="absolute -top-1 -right-6 text-2xl font-black text-cyan-500">
                    %
                  </span>
                </div>

                <div
                  className={`mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all ${
                    details.status === "PASSED"
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]"
                  }`}
                >
                  {details.status === "PASSED" ? (
                    <Trophy size={14} />
                  ) : (
                    <Target size={14} />
                  )}
                  {details.status}
                </div>
              </div>

              {/* Analytics Graph */}
              <div className="lg:col-span-2 p-8 bg-white/[0.02] rounded-[2rem] border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    Comparative_Vector
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        Subject
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase">
                        Avg_Matrix
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "SUBJECT",
                          score: details.score,
                          fill: "#22d3ee",
                        },
                        { name: "MATRIX", score: 72, fill: "#d946ef" },
                      ]}
                      layout="vertical"
                      barCategoryGap="30%"
                    >
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#475569",
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: "0.1em",
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.02)" }}
                        contentStyle={{
                          backgroundColor: "#0b0c24",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "10px",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="score"
                        radius={[0, 12, 12, 0]}
                        className="transition-all duration-1000"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] shrink-0">
                  Detailed_Protocol_Log
                </h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.answers.map((ans: any, idx: number) => (
                  <div
                    key={ans.id}
                    className={`group relative p-6 rounded-[1.5rem] border transition-all duration-300 ${
                      ans.option.isCorrect
                        ? "bg-green-500/[0.02] border-green-500/10 hover:border-green-500/30"
                        : "bg-fuchsia-500/[0.02] border-fuchsia-500/10 hover:border-fuchsia-500/30"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        CHUNK_{String(idx + 1).padStart(2, "0")}
                      </span>
                      <div
                        className={`p-1.5 rounded-lg border ${
                          ans.option.isCorrect
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
                        }`}
                      >
                        {ans.option.isCorrect ? (
                          <CheckCircle size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                      </div>
                    </div>

                    <p className="text-[13px] font-bold text-white mb-6 leading-relaxed flex items-start gap-2">
                      <span className="text-white/20 mt-1">
                        <Hash size={12} />
                      </span>
                      {ans.question.text}
                    </p>

                    <div className="space-y-2">
                      <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">
                        Response_Value
                      </div>
                      <div
                        className={`p-3 rounded-xl border text-[11px] font-bold ${
                          ans.option.isCorrect
                            ? "bg-green-500/5 border-green-500/10 text-green-400"
                            : "bg-fuchsia-500/5 border-fuchsia-500/10 text-fuchsia-400"
                        }`}
                      >
                        {ans.option.text.toUpperCase()}
                      </div>
                    </div>

                    {/* Background accent */}
                    <div
                      className={`absolute bottom-0 right-0 w-12 h-12 opacity-[0.03] transition-opacity group-hover:opacity-[0.07] ${
                        ans.option.isCorrect
                          ? "text-green-500"
                          : "text-fuchsia-500"
                      }`}
                    >
                      {ans.option.isCorrect ? (
                        <CheckCircle className="w-full h-full" />
                      ) : (
                        <XCircle className="w-full h-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-center">
            <p className="text-[8px] font-mono text-slate-600 uppercase tracking-[0.5em]">
              End_Of_Transmission // Verified_Results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
