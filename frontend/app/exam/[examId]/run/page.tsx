"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import FocusGuard from "./components/FocusGuard";
import Modal from "@/components/ui/Modal";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  HelpCircle,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import { Toaster, toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  points: number;
  options: Option[];
}

interface ExamData {
  id: string;
  title: string;
  description: string;
  durationMinutes: number; // UPDATED: Match backend field
  strictMode: boolean;
  questions: Question[];
}

export default function ExamRunnerPage() {
  const { examId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { questionId: optionId }
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    status: string;
    totalPoints: number;
    maxPoints: number;
  } | null>(null);

  // Load Exam
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/exam/${examId}/run`);
      return;
    }

    const fetchExam = async () => {
      try {
        const res = await api.get(`/lms/exams/${examId}/take`);
        if (res.data.data) {
          const data = res.data.data;
          setExam(data);
          // Set initial time (convert min to sec)
          // Ideally we sync with server start time if user refreshed,
          // but for V1 we just reset or use localStorage to persist 'startTime'
          const storedStartTime = localStorage.getItem(`exam_start_${examId}`);
          let seconds = (data.durationMinutes || 60) * 60;

          if (storedStartTime) {
            const elapsed = Math.floor(
              (Date.now() - parseInt(storedStartTime)) / 1000
            );
            seconds = Math.max(0, seconds - elapsed);
          } else {
            localStorage.setItem(`exam_start_${examId}`, Date.now().toString());
          }

          setTimeLeft(seconds);
        }
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          toast.error("Access Denied: You must be enrolled to take this exam.");
          // Redirect to courses list or maybe specific course if we had ID,
          // but we only have examId here. Backend sends data: null.
          // Best to go to /courses
          router.push("/courses");
        } else {
          toast.error("Failed to load exam");
          router.back();
        }
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchExam();
  }, [examId, router, user, authLoading]);

  // Timer Logic
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft]); // Missing dependency handleSubmit usually implies useCallback, handled below

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Answer Handler
  const handleSelectOption = (optionId: string) => {
    if (!exam) return;
    const qId = exam.questions[currentQuestionIndex].id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionId,
    }));
  };

  // Exit Handler (Safe)
  const handleExitRequest = () => {
    // Disable guard before showing modal
    setIsSubmitting(true);
    setShowExitModal(true);
  };

  const cancelExit = () => {
    setShowExitModal(false);
    setIsSubmitting(false); // Re-enable guard
  };

  const confirmExit = () => {
    router.push("/courses");
  };

  // Submit Handler
  const handleSubmit = async (auto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const toastId = toast.loading("Submitting exam...");

    try {
      const res = await api.post(`/lms/exams/${examId}/submit`, { answers });
      if (res.data.ok) {
        toast.success("Exam Submitted!", { id: toastId });
        localStorage.removeItem(`exam_start_${examId}`); // Clear temp timer
        setSubmissionResult(res.data.data);
        setShowSubmitModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Submission failed", {
        id: toastId,
      });
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (authLoading || !user || loading || !exam) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center text-teal-500">
        Loading Exam Environment...
      </div>
    );
  }

  const currentQ = exam.questions[currentQuestionIndex];
  const progress = (Object.keys(answers).length / exam.questions.length) * 100;
  const isUrgent = timeLeft < 300; // < 5 mins

  if (submissionResult) {
    const isPassed = submissionResult.status === "PASSED";
    return (
      <div className="min-h-screen bg-[#0b0724] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
        <div className="bg-[#0f0b1e] border border-white/10 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl relative z-10 animate-in zoom-in-0 slide-in-from-bottom-5 duration-300">
          <div
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-4 ${
              isPassed
                ? "bg-green-500/10 border-green-500 text-green-500"
                : "bg-red-500/10 border-red-500 text-red-500"
            }`}
          >
            {isPassed ? <CheckCircle size={48} /> : <XCircle size={48} />}
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            {isPassed ? "Exam Passed!" : "Exam Failed"}
          </h1>
          <p className="text-slate-400 mb-8">You have completed the exam.</p>

          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
            <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">
              Your Score
            </div>
            <div
              className={`text-5xl font-mono font-bold ${
                isPassed ? "text-green-400" : "text-red-400"
              }`}
            >
              {Math.round(submissionResult.score)}
              <span className="text-2xl text-slate-500">/100</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {submissionResult.totalPoints} / {submissionResult.maxPoints}{" "}
              Points
            </div>

            {/* Practice Indicator */}
            {(submissionResult as any).isPractice && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest py-2 rounded-lg">
                Practice Mode (Not Saved)
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/courses")}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all"
            >
              Return to Course
            </button>
            {/* Optional: View Certificate if passed? */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0724] text-white font-sans flex flex-col md:flex-row overflow-hidden">
      {/* 
         Pass strict mode preference to FocusGuard.
         If strictMode is false (undefined/null -> false), FocusGuard is effectively disabled 
         by passing disabled={true} OR we can handle logic inside FocusGuard.
         Current Logic: `disabled={isSubmitting}`.
         New Logic: `disabled={isSubmitting || !exam.strictMode}`.
      */}
      <FocusGuard disabled={isSubmitting || !exam.strictMode} />

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <AlertDialogContent className="bg-[#0f0b1e] border border-white/10 text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Finish Exam?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {exam.questions.length - Object.keys(answers).length > 0
                ? `You have ${
                    exam.questions.length - Object.keys(answers).length
                  } unanswered questions. `
                : ""}
              Are you sure you want to submit? You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleSubmit(false)}
              className="bg-teal-500 hover:bg-teal-600 text-white border-0"
            >
              Submit Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={cancelExit}
        title="Exit Exam?"
        description="Are you sure you want to leave? Your progress will be LOST. This action cannot be undone."
        confirmText="Yes, Exit Exam"
        variant="danger"
        onConfirm={confirmExit}
      />

      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 z-30 bg-[#050510] border-b border-teal-900/30 p-4 flex items-center justify-between shadow-lg shadow-black/50">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white border border-white/10">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-[#050510] border-r border-teal-900/30 p-0 w-[300px]"
            >
              <SheetHeader className="p-4 border-b border-white/5 bg-[#0f0b1e]">
                <SheetTitle className="text-white text-left">
                  Exam Map
                </SheetTitle>
                <SheetDescription className="text-slate-400 text-left text-xs">
                  {Object.keys(answers).length} of {exam.questions.length}{" "}
                  Answered
                </SheetDescription>
              </SheetHeader>
              <div className="p-4 h-full overflow-y-auto pb-20">
                {/* Logic duplicated for Sheet (or we could extract component) */}
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((q, idx) => {
                    const isAnswered = answers[q.id];
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)} // Sheet stays open? Maybe better.
                        className={`aspect-square rounded-lg text-sm font-bold flex items-center justify-center transition-all border
                          ${
                            isCurrent
                              ? "border-teal-400 bg-teal-500/10 text-teal-400"
                              : isAnswered
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                          }
                        `}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <button
                    onClick={handleExitRequest}
                    className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all w-full text-sm font-bold uppercase"
                  >
                    <ArrowLeft size={16} /> Exit Exam
                  </button>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="mt-4 w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-bold transition-all uppercase tracking-widest text-xs"
                  >
                    Finish Exam
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              Time Left
            </span>
            <span
              className={`font-mono font-bold leading-none ${
                isUrgent ? "text-red-400 animate-pulse" : "text-white"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            Question
          </div>
          <div className="text-white font-bold leading-none">
            {currentQuestionIndex + 1}{" "}
            <span className="text-slate-600">/ {exam.questions.length}</span>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar: Question Grid */}
      <aside className="hidden md:flex w-80 bg-[#050510] border-r border-teal-900/30 flex-col p-6 z-20 h-screen sticky top-0 overflow-y-auto">
        <button
          onClick={handleExitRequest}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-all w-full"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Exit Exam
          </span>
        </button>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-teal-400 mb-2 truncate">
            {exam.title}
          </h1>
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>
              {Object.keys(answers).length} / {exam.questions.length} Answered
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Timer Box */}
        <div
          className={`p-4 rounded-xl border ${
            isUrgent
              ? "bg-red-950/20 border-red-500/30 animate-pulse"
              : "bg-slate-900 border-slate-800"
          } mb-6 text-center`}
        >
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">
            Time Remaining
          </div>
          <div
            className={`text-4xl font-mono font-bold ${
              isUrgent ? "text-red-400" : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-5 gap-2 content-start custom-scrollbar">
          {exam.questions.map((q, idx) => {
            const isAnswered = answers[q.id];
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`aspect-square rounded-lg text-sm font-bold flex items-center justify-center transition-all border
                  ${
                    isCurrent
                      ? "border-teal-400 bg-teal-500/10 text-teal-400"
                      : isAnswered
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  }
                `}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="mt-6 w-full py-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-teal-900/20 transition-all uppercase tracking-widest text-sm shrink-0"
        >
          Finish Exam
        </button>
      </aside>

      {/* Main Content: Question Card */}
      <main className="flex-1 relative flex flex-col p-4 md:p-12 overflow-y-auto h-screen">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>

        <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col justify-center">
          <div className="mb-0 flex items-center justify-between">
            <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">
              Question {currentQuestionIndex + 1}
            </span>
            <span className="text-slate-500 text-sm">
              {currentQ.points} Points
            </span>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-10 my-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-500 to-cyan-500"></div>
            <h2 className="text-2xl md:text-3xl font-medium text-white mb-8 leading-relaxed">
              {currentQ.text}
            </h2>

            <div className="space-y-4">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center group/opt
                          ${
                            isSelected
                              ? "border-teal-500 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.1)]"
                              : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800"
                          }
                        `}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all
                            ${
                              isSelected
                                ? "border-teal-500 bg-teal-500 text-white"
                                : "border-slate-600 group-hover/opt:border-slate-400"
                            }
                         `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span
                      className={`text-lg ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              <ChevronLeft className="mr-2 w-5 h-5" /> Previous
            </button>

            {currentQuestionIndex < exam.questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(exam.questions.length - 1, prev + 1)
                  )
                }
                className="flex items-center px-8 py-3 rounded-xl bg-white text-[#0b0724] hover:bg-gray-200 transition-all font-bold shadow-lg shadow-white/10"
              >
                Next <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center px-8 py-3 rounded-xl bg-teal-500 text-white hover:bg-teal-400 transition-all font-bold shadow-lg shadow-teal-500/20"
              >
                Finish <CheckCircle className="ml-2 w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
