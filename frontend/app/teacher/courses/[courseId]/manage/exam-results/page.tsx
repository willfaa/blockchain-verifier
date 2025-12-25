"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Users,
  Award,
  AlertTriangle,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart2,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";

export default function ExamResultsPage() {
  const params = useParams();
  const courseId = params?.courseId as string; // Check logic
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null); // Exam metadata
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalAttempts: 0,
    avgScore: 0,
    hardestQuestion: "N/A",
  });

  // Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Get Exam ID from Course
      const examRes = await api.get(`/lms/courses/${courseId}/exam`);
      if (!examRes.data.data) {
        toast.error("No exam found for this course.");
        router.push(`/teacher/courses/${courseId}/manage/exam`);
        return;
      }
      const examData = examRes.data.data;
      setExam(examData);

      // 2. Get Submissions
      const subRes = await api.get(`/lms/exams/${examData.id}/submissions`);
      if (subRes.data.ok) {
        setSubmissions(subRes.data.data.submissions);
        setAnalytics(subRes.data.data.analytics);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/lms/exams/submissions/${deleteId}`);
      toast.success("Attempt reset.");
      setSubmissions((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
      // Optionally reload analytics
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openDetails = (sub: any) => {
    setSelectedSubmission(sub);
    setShowDetailModal(true);
  };

  if (loading)
    return (
      <div className="p-10 text-center text-slate-400">
        Loading Analytics...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto text-base text-slate-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 text-sm"
          >
            <ArrowLeft size={16} /> Back to Exam Manager
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-cyan-400" />
            Results: {exam?.title}
          </h1>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-sm"
        >
          Refresh data
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#0f0b1e] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-4 rounded-full text-blue-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">
              {analytics.totalAttempts}
            </div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">
              Total Attempts
            </div>
          </div>
        </div>
        <div className="bg-[#0f0b1e] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="bg-green-500/10 p-4 rounded-full text-green-400">
            <Award size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">
              {analytics.avgScore}%
            </div>
            <div className="text-sm text-slate-500 uppercase tracking-widest">
              Average Score
            </div>
          </div>
        </div>
        <div className="bg-[#0f0b1e] border border-white/5 p-6 rounded-xl flex items-center gap-4">
          <div className="bg-orange-500/10 p-4 rounded-full text-orange-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div
              className="text-sm font-bold text-white line-clamp-2"
              title={analytics.hardestQuestion}
            >
              {analytics.hardestQuestion}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">
              Hardest Question
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f0b1e] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#13132b] min-w-[700px]">
            <h3 className="font-bold text-white">Student Submissions</h3>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Search student..."
                className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4">Student</th>
                <th className="p-4">Score</th>
                <th className="p-4">Status</th>
                <th className="p-4">Submitted At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub: any) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-medium text-white">
                      {sub.student.name}{" "}
                      <div className="text-xs text-slate-500">
                        {sub.student.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-mono font-bold text-lg ${
                          sub.score >= (exam.passingScore || 60)
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {Math.round(sub.score)}
                      </span>
                    </td>
                    <td className="p-4">
                      {sub.status === "PASSED" ? (
                        <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/20">
                          PASSED
                        </span>
                      ) : (
                        <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/20">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {new Date(sub.finishedAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openDetails(sub)}
                        className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded mr-2"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteId(sub.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                        title="Reset Attempt"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Reset Attempt?"
        description="This will permanently delete the student's submission and allow them to take the exam again."
        confirmText="Delete & Reset"
        variant="danger"
        onConfirm={handleDelete}
      />

      {/* Detail View Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f0b1e] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#13132b]">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedSubmission.student.name}'s Attempt
                </h2>
                <div className="text-sm text-slate-400">
                  Score: {Math.round(selectedSubmission.score)}% •{" "}
                  {selectedSubmission.status}
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0b0724]">
              {selectedSubmission.answers.map((ans: any, idx: number) => {
                // Note: ans.option is Selected Option.
                // We also need "Correct Option" which is NOT directly in 'ans',
                // but 'ans.question' might not include all options unless we fix the include.
                // The `getExamSubmissions` include logic:
                // answers: { include: { question: { select: ... }, option: ... } }
                // It does NOT include ALL options of the question, only the question text.
                // Limitation: We can only show "Selected Option" and if it was Correct.
                // We can't show "What IS the correct option" if they got it wrong,
                // unless we fetch full question data.
                // However, ans.option.isCorrect tells us if they were right.

                const isCorrect = ans.option.isCorrect;
                return (
                  <div
                    key={ans.id}
                    className={`p-4 rounded-xl border ${
                      isCorrect
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-slate-300">
                        Question {idx + 1}
                      </span>
                      {isCorrect ? (
                        <span className="text-green-400 flex items-center gap-1 text-xs uppercase font-bold">
                          <CheckCircle size={14} /> Correct
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 text-xs uppercase font-bold">
                          <XCircle size={14} /> Incorrect
                        </span>
                      )}
                    </div>
                    <p className="text-white text-lg mb-4">
                      {ans.question.text}
                    </p>

                    <div className="text-sm text-slate-400 mb-1 uppercase tracking-wider text-[10px]">
                      Selected Answer
                    </div>
                    <div
                      className={`p-3 rounded-lg border flex items-center gap-2 ${
                        isCorrect
                          ? "bg-green-500/20 border-green-500/50 text-green-100"
                          : "bg-red-500/20 border-red-500/50 text-red-100"
                      }`}
                    >
                      {ans.option.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#13132b] flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
