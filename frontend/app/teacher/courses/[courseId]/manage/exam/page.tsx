"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
  Upload,
  Zap,
  ShieldCheck,
  Clock,
  LayoutDashboard,
  Settings,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ManageExamPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [settings, setSettings] = useState({
    durationMinutes: 60,
    passingScore: 70,
    isEnabled: false,
    strictMode: false,
    isPractice: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    if (courseId) {
      fetchExamData();
      fetchCourseTitle();
    }
  }, [courseId]);

  const fetchCourseTitle = async () => {
    try {
      const res = await api.get(`/lms/courses/${courseId}`);
      if (res.data.ok) setCourseTitle(res.data.data.title);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}/exam`);
      if (res.data.ok) {
        const examData = res.data.data;
        if (examData) {
          setExam(examData);
          setSettings({
            durationMinutes: examData.durationMinutes || 60,
            passingScore: examData.passingScore || 70,
            isEnabled: examData.isEnabled || false,
            strictMode: examData.strictMode || false,
            isPractice: examData.isPractice || false,
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync exam matrix");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      await api.post(`/lms/courses/${courseId}/exam`, {
        ...settings,
        title: exam?.title || "Final Assessment",
      });
      await fetchExamData();
      toast.success("Configuration Protocols Updated");
    } catch (error) {
      toast.error("Protocol sync failed");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/lms/exams/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Question_Template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template Manifest Downloaded");
    } catch (error) {
      toast.error("Template retrieval failed");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !exam?.id) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsImporting(true);
      await api.post(`/lms/exams/${exam.id}/questions/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Batch Data Injected Successfully");
      fetchExamData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Injection failed");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim())
      return toast.error("Manifest entry requires text");
    const validOptions = newQuestion.options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2)
      return toast.error("Minimum 2 choices required");

    try {
      setSavingQuestion(true);
      const optionsPayload = newQuestion.options.map((opt, idx) => ({
        text: opt,
        isCorrect: idx === newQuestion.correctIndex,
      }));

      await api.post(`/lms/courses/${courseId}/exam/questions`, {
        text: newQuestion.text,
        type: "MULTIPLE_CHOICE",
        points: 10,
        options: optionsPayload,
      });

      toast.success("Data Entry Logged");
      setIsModalOpen(false);
      setNewQuestion({ text: "", options: ["", "", "", ""], correctIndex: 0 });
      fetchExamData();
    } catch (error) {
      toast.error("Logging protocol failed");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleToggleQuestion = async (questionId: string) => {
    try {
      await api.patch(`/lms/questions/${questionId}/toggle`);
      setExam((prev: any) => ({
        ...prev,
        questions: prev.questions.map((q: any) =>
          q.id === questionId ? { ...q, isActive: !q.isActive } : q
        ),
      }));
      toast.success("Status Updated");
    } catch (err) {
      toast.error("Sync failed");
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
  };

  const executeDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await api.delete(`/lms/questions/${questionToDelete}`);
      setExam((prev: any) => ({
        ...prev,
        questions: prev.questions.filter((q: any) => q.id !== questionToDelete),
      }));
      toast.success("Entry Purged");
      setQuestionToDelete(null);
    } catch (err) {
      toast.error("Purge failure");
    }
  };

  if (loading && !exam) return <CyberpunkLoader text="Loading Exam Data..." />;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            Exam Management
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.3em] mt-1">
            Configure Assessment Settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSettingsSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-cyan-500 to-blue-600 hover:brightness-125 text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            <Save size={14} /> Save Configuration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* CONFIGURATION PANEL */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap size={120} className="text-cyan-500" />
            </div>
            <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
              <ShieldCheck size={14} /> Exam Configuration
            </h2>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} /> Time Limit (Min)
                </label>
                <input
                  type="number"
                  value={settings.durationMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-cyan-500/50 outline-none transition-all font-mono text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} /> Passing Grade (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.passingScore}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      passingScore: Number(e.target.value),
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-cyan-500/50 outline-none transition-all font-mono text-sm"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                {[
                  {
                    label: "Proctored Mode",
                    key: "strictMode",
                    sub: "Prevent tab switching",
                    color: "text-red-500",
                    peer: "peer-checked:bg-red-500",
                  },
                  {
                    label: "Practice Exam",
                    key: "isPractice",
                    sub: "No impact on final grade",
                    color: "text-yellow-500",
                    peer: "peer-checked:bg-yellow-500",
                  },
                  {
                    label: "Published & Ready",
                    key: "isEnabled",
                    sub: "Students can start exam",
                    color: "text-cyan-500",
                    peer: "peer-checked:bg-cyan-500",
                  },
                ].map((toggle) => (
                  <div
                    key={toggle.key}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${toggle.color}`}
                      >
                        {toggle.label}
                      </span>
                      <p className="text-[8px] text-slate-600 uppercase mt-1 tracking-wider">
                        {toggle.sub}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings as any)[toggle.key]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [toggle.key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div
                        className={`w-11 h-6 bg-white/10 rounded-full peer ${toggle.peer} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full shadow-inner`}
                      ></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl">
            <div className="flex items-start gap-4">
              <LayoutDashboard
                className="text-cyan-500 shrink-0 mt-1"
                size={18}
              />
              <div>
                <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                  Information
                </h4>
                <p className="text-[9px] text-slate-400 font-mono leading-relaxed mt-2 uppercase">
                  Proctored exams monitor student activity. Practice exams do
                  not affect the student's final records.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION BANK SECTION */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-6 border-b border-white/5">
              {/* 1. TITLE GROUP (Updated Layout) */}
              <div className="flex items-center gap-5">
                {/* TEXT STACK: QUESTION & BANK (Dipisah agar rapi) */}
                <div className="flex flex-col items-start justify-center">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-[0.85]">
                    Question
                  </h2>
                  <h2 className="text-3xl font-black text-white/50 uppercase tracking-tighter leading-[0.85]">
                    Bank
                  </h2>
                </div>

                {/* COUNTER BADGE (Di tengah samping) */}
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-lg font-mono text-cyan-400 font-bold shadow-inner">
                  {exam?.questions?.length || 0}
                </div>
              </div>

              {/* 2. ACTION BUTTONS GROUP */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />

                {/* GROUP: TEMPLATE & IMPORT */}
                <div className="flex flex-wrap gap-2 grow md:grow-0">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-xl transition-all whitespace-nowrap min-w-[100px]"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Template</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap min-w-[140px]"
                  >
                    {isImporting ? (
                      <CyberpunkLoader className="py-0" text="" />
                    ) : (
                      <Upload size={16} />
                    )}
                    <span>Import Questions</span>
                  </button>
                </div>

                {/* BUTTON: ADD QUESTION */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest bg-cyan-500 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 whitespace-nowrap min-w-[140px]"
                >
                  <Plus size={18} strokeWidth={3} />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* CONTENT SECTION (LIST QUESTIONS) - TETAP SAMA */}
            {!exam?.questions || exam.questions.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-3xl group hover:border-white/10 transition-colors">
                <LayoutDashboard
                  className="text-white/5 mx-auto mb-4 group-hover:text-cyan-500/20 transition-colors"
                  size={64}
                />
                <p className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.3em]">
                  Exam Records Empty: No data detected
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* ... (Mapping Questions Code Tetap Sama) ... */}
                {exam.questions.map((q: any, idx: number) => (
                  /* ... Gunakan kode list question sebelumnya ... */
                  <div
                    key={q.id}
                    className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex items-start gap-6 group hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all shadow-sm"
                  >
                    {/* ... konten question ... */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 font-mono text-xs font-black shrink-0 border border-white/5 group-hover:text-cyan-500 group-hover:border-cyan-500/30 transition-all">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-slate-200 mb-4 group-hover:text-white transition-colors leading-relaxed">
                        {q.text}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt: any) => (
                          <div
                            key={opt.id}
                            className={`px-4 py-3 rounded-xl border flex items-center justify-between text-[11px] font-medium transition-all ${
                              opt.isCorrect
                                ? "bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                : "bg-black/20 border-white/[0.05] text-slate-500"
                            }`}
                          >
                            <span className="truncate pr-2">{opt.text}</span>
                            {opt.isCorrect && (
                              <CheckCircle size={14} className="shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-4 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.isActive}
                          onChange={() => handleToggleQuestion(q.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANUAL ENTRY MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0b0c24] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden p-0 max-h-[90vh] flex flex-col">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600"></div>

          <div className="p-8 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter">
                  New Question
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-[9px] font-mono uppercase tracking-widest mt-1">
                  Direct Question Entry
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar font-mono flex-1">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest ml-1">
                  Question Text
                </label>
                <textarea
                  autoFocus
                  value={newQuestion.text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, text: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-cyan-500/50 outline-none min-h-[120px] transition-all"
                  placeholder="Enter the exam question here..."
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-cyan-500 uppercase tracking-widest ml-1">
                  Answers
                </label>
                {newQuestion.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-4 p-2 pl-4 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.04]"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="radio"
                        name="correctIndex"
                        checked={newQuestion.correctIndex === idx}
                        onChange={() =>
                          setNewQuestion({
                            ...newQuestion,
                            correctIndex: idx,
                          })
                        }
                        className="w-5 h-5 bg-black border-2 border-white/10 rounded-full checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer appearance-none"
                      />
                      {newQuestion.correctIndex === idx && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-black">
                          <CheckCircle size={10} />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                      className="flex-1 bg-transparent border-none text-white text-sm outline-none placeholder:text-white/10"
                      placeholder={`Option ${String.fromCharCode(
                        65 + idx
                      )}...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-4 pt-6 border-t border-white/5 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
              >
                [ Cancel ]
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={savingQuestion}
                className="px-8 py-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:brightness-125 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {savingQuestion ? (
                  <CyberpunkLoader className="py-0" text="" />
                ) : (
                  <Save size={16} />
                )}
                Save Question
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PURGE CONFIRMATION */}
      <AlertDialog
        open={!!questionToDelete}
        onOpenChange={(open: boolean) => !open && setQuestionToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0b0c24] border border-white/10 text-white rounded-3xl shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              You are about to permanently delete this question from the exam.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 font-mono text-[10px] uppercase tracking-widest">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteQuestion}
              className="bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
            >
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SettingsIcon() {
  return <Settings className="w-5 h-5" />;
}
