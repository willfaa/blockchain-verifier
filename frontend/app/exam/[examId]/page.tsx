"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import {
  Clock,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ExamIntroPage() {
  const params = useParams();
  const examId = params?.examId as string;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [notEnrolled, setNotEnrolled] = useState<boolean>(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/exam/${examId}`);
      return;
    }

    if (examId) {
      // Use the 'take' endpoint just to peek metadata, or we might need a separate 'meta' endpoint?
      // 'take' endpoint returns questions... maybe too heavy?
      // But we don't have another endpoint yet. Let's use it or just try to get course info?
      // Ideally we should have GetExamMeta.
      // But 'take' returns the exam object. Let's use it for now.
      // If 'take' creates an attempt, that might be bad?
      // Looking at controller (Task 72 summary), 'getExamForAttempt' just fetches.
      // It doesn't create a 'Result' record until Submit.
      // So calling it here is safe.
      api
        .get(`/lms/exams/${examId}/take`)
        .then((res) => {
          console.log("Raw API Response:", res);
          console.log("Response Data:", res.data);

          // Flexible check to handle { data: ... } or { ok: true, data: ... }
          const examData = res.data.data || res.data;

          if (examData && (res.data.ok || res.status === 200)) {
            setExam(examData);
          } else {
            console.error("Structure mismatch or error", res.data);
            setError("Invalid server response structure.");
          }
        })
        .catch((err) => {
          // Check for 403 Not Enrolled
          if (err.response && err.response.status === 403) {
            setNotEnrolled(true);
            setCourseId(err.response.data?.courseId || null);
            setError("You must enroll in the course to take this exam.");
          } else {
            console.error(err);
            // Show specific error from backend (e.g. "Exam is disabled") or fallback
            setError(
              err.response?.data?.error || "Failed to load exam details."
            );
          }
        })

        .finally(() => setLoading(false));
    }
  }, [examId, user, authLoading, router]);

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-[#0b0724] flex items-center justify-center text-cyan-400">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  // Handle NOT ENROLLED State
  if (notEnrolled) {
    return (
      <div className="min-h-screen bg-[#0b0724] flex flex-col text-slate-50 relative overflow-hidden">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
          <div className="bg-[#0d0b2f] border border-red-500/30 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative z-10 animate-in zoom-in-0 duration-300">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 text-red-500">
              <AlertOctagon size={40} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Enrollment Required
            </h1>
            <p className="text-slate-400 mb-8">
              You are not enrolled in the course associated with this exam. You
              must enroll first to proceed.
            </p>

            <div className="flex flex-col gap-3">
              {courseId ? (
                <button
                  onClick={() => router.push(`/courses/${courseId}`)}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  Go to Course Enrollment
                </button>
              ) : (
                <Link
                  href="/courses"
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                >
                  Browse All Courses
                </Link>
              )}
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-white mt-2"
              >
                Go Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-[#0b0724] flex items-center justify-center text-slate-500 flex-col">
        <Navbar />
        <AlertOctagon size={48} className="mb-4 text-red-500" />
        <p className="text-xl mb-4">{error || "Exam not found"}</p>
        <Link href="/courses" className="text-cyan-400 hover:underline">
          Return to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0724] text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 bg-[url('/grid.svg')] bg-fixed">
        <div className="max-w-2xl w-full bg-[#0d0b2f]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          {/* Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/30 text-cyan-400">
              <CheckCircle size={40} />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {exam.title}
            </h1>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              You are about to start the final exam. Please ensure you have a
              stable internet connection and enough time to complete it in one
              sitting.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10">
              <div className="bg-[#0b0724] p-4 rounded-xl border border-white/5 flex flex-col items-center">
                <Clock className="text-cyan-400 mb-2" size={24} />
                <span className="text-2xl font-bold font-mono">
                  {exam.duration || exam.durationMinutes || "?"}
                </span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Minutes
                </span>
              </div>
              <div className="bg-[#0b0724] p-4 rounded-xl border border-white/5 flex flex-col items-center">
                <AlertOctagon className="text-orange-400 mb-2" size={24} />
                <span className="text-2xl font-bold font-mono">
                  {exam.questions?.length || 0}
                </span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  Questions
                </span>
              </div>
            </div>

            {(!exam.questions || exam.questions.length === 0) && (
              <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl text-orange-200 mb-6 text-sm">
                This exam has no questions yet. Please contact your instructor.
              </div>
            )}

            <ul className="text-left text-sm text-slate-400 space-y-3 bg-white/5 p-6 rounded-xl border border-white/5 mb-10 mx-auto max-w-lg">
              <li className="flex gap-3">
                <span className="text-cyan-500">•</span>
                Strict Mode is enabled. Switching tabs may be flagged.
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-500">•</span>
                Once started, the timer cannot be paused.
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-500">•</span>
                Ensure all questions are answered before submitting.
              </li>
            </ul>

            <Link
              href={`/exam/${examId}/run`}
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1"
            >
              Start Exam Now <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
