//frontend/app/teacher/courses/[courseId]/manage/exam/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  Upload,
  Download,
} from "lucide-react";
import Modal from "@/components/ui/Modal"; // Assuming generic modal or we build one
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

export default function ManageExamPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null); // entire exam object
  // Local state for settings form to track changes
  const [settings, setSettings] = useState({
    durationMinutes: 60,
    passingScore: 70,
    isEnabled: false,
    strictMode: false,
    isPractice: false,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0, // 0-3
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // --- EXCEL IMPORT / EXPORT ---
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [courseTitle, setCourseTitle] = useState("");

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/lms/exams/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Sanitize title for filename
      const safeTitle = courseTitle.replace(/[^a-zA-Z0-9-_]/g, "_");
      link.setAttribute(
        "download",
        `Question_Template_${safeTitle || "Exam"}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!exam?.id) {
      toast.error("Please save settings first to create the exam.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsImporting(true);
      await api.post(`/lms/exams/${exam.id}/questions/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Questions imported successfully!");
      fetchExamData(); // Refresh list
    } catch (error: any) {
      console.error("Import Error:", error);
      toast.error(error.response?.data?.error || "Failed to import questions");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchExamData();
      fetchCourseTitle();
    }
  }, [courseId]);

  const fetchCourseTitle = async () => {
    try {
      const res = await api.get(`/lms/courses/${courseId}`);
      if (res.data.data) setCourseTitle(res.data.data.title);
    } catch (error) {
      console.error("Failed to fetch course title", error);
    }
  };

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}/exam`);
      const examData = res.data.data; // Can be null if no exam yet
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
    } catch (error) {
      console.error("Failed to fetch exam:", error);
      toast.error("Failed to load exam data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      const res = await api.post(`/lms/courses/${courseId}/exam`, {
        ...settings,
        title: exam?.title || "Course Final Exam", // Preserve or default
      });
      // Option A: Refetch to ensure we get the full object including questions relation
      // The API response from upsert doesn't include questions, so direct setExam would wipe them out.
      await fetchExamData();
      toast.success("Exam settings saved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings.");
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      toast.error("Question text is required");
      return;
    }
    // Basic validation: ensure at least 2 options filled?
    const validOptions = newQuestion.options.filter((o) => o.trim().length > 0);
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options.");
      return;
    }

    try {
      setSavingQuestion(true);

      // Fix index logic: Map options to objects, then set isCorrect based on original index match
      // Actually easier:
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

      toast.success("Question added!");
      setIsModalOpen(false);
      setNewQuestion({
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
      });
      fetchExamData(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Failed to add question.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleToggleQuestion = async (questionId: string) => {
    // Optimistic update
    const currentQ = exam.questions.find((q: any) => q.id === questionId);
    if (!currentQ) return;

    // UI Update immediately? Or wait? Let's wait for safety first iteration.
    try {
      await api.patch(`/lms/questions/${questionId}/toggle`);
      // Refresh or manually update local state
      setExam((prev: any) => ({
        ...prev,
        questions: prev.questions.map((q: any) =>
          q.id === questionId ? { ...q, isActive: !q.isActive } : q
        ),
      }));
      toast.success("Updated status");
    } catch (err) {
      toast.error("Failed to toggle status");
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
      toast.success("Question deleted");
      setQuestionToDelete(null);
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center text-cyan-500">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Exam Management</h1>
        <p className="text-slate-400">
          Configure the final exam and manage the question bank.
        </p>
      </div>

      {/* --- SECTION 1: SETTINGS --- */}
      <div className="bg-[#0d0b2f] border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <SettingsIcon /> Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Duration (Minutes)
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
              className="w-full bg-[#0b0724] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Passing Score (%)
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
              className="w-full bg-[#0b0724] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Strict Mode
            </label>
            <div className="flex items-center gap-4 h-[50px] p-2 border border-white/10 rounded-xl bg-slate-900/50">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.strictMode}
                  onChange={(e) =>
                    setSettings({ ...settings, strictMode: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                <span className="ml-3 text-sm font-bold text-white">
                  {settings.strictMode ? "Strict (Locks Window)" : "Relaxed"}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Practice Mode{" "}
              <span className="text-yellow-500 text-xs ml-1">(Ghost Mode)</span>
            </label>
            <div className="flex items-center gap-4 h-[50px] p-2 border border-white/10 rounded-xl bg-slate-900/50">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isPractice}
                  onChange={(e) =>
                    setSettings({ ...settings, isPractice: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                <span className="ml-3 text-sm font-bold text-white">
                  {settings.isPractice ? "Practice (No Save)" : "Standard Exam"}
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <div className="flex items-center gap-4 h-[50px]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, isEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-cyan-500"></div>
                <span className="ml-3 text-sm font-medium text-white">
                  {settings.isEnabled
                    ? "Enabled (Visible)"
                    : "Disabled (Draft)"}
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSettingsSave}
            className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all"
          >
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>

      {/* --- SECTION 2: QUESTION BANK --- */}
      <div className="bg-[#0d0b2f] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle /> Question Bank ({exam?.questions?.length || 0})
          </h2>

          <div className="flex items-center gap-2">
            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-white/5"
              title="Download Excel Template"
            >
              <FileSpreadsheet size={16} /> Template
            </button>

            <button
              onClick={handleImportTrigger}
              disabled={isImporting}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-500/30 rounded-lg transition-all disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Import Excel
            </button>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all"
            >
              <Plus size={18} /> Add Manually
            </button>
          </div>
        </div>

        {!exam || !exam.questions || exam.questions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
            <p>No questions added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exam.questions.map((q: any, idx: number) => (
              <div
                key={q.id}
                className="bg-[#0b0724] border border-white/5 rounded-xl p-4 flex items-start gap-4 group hover:border-white/10 transition-colors"
              >
                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 font-mono text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-2">{q.text}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`text-xs px-3 py-1.5 rounded border flex items-center justify-between ${
                          opt.isCorrect
                            ? "bg-green-900/20 border-green-500/30 text-green-400"
                            : "bg-white/5 border-transparent text-slate-500"
                        }`}
                      >
                        {opt.text}
                        {opt.isCorrect && <CheckCircle size={12} />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {/* Toggle Switch inside List */}
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    title="Include in Exam"
                  >
                    <input
                      type="checkbox"
                      checked={q.isActive}
                      onChange={() => handleToggleQuestion(q.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- ADD QUESTION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0d0b2f] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <XCircle size={24} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              Add New Question
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Question Text
                </label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, text: e.target.value })
                  }
                  className="w-full bg-[#0b0724] border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none min-h-[100px]"
                  placeholder="Enter the question here..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-400">
                  Options
                </label>
                {newQuestion.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctIndex"
                      checked={newQuestion.correctIndex === idx}
                      onChange={() =>
                        setNewQuestion({ ...newQuestion, correctIndex: idx })
                      }
                      className="w-4 h-4 accent-cyan-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                      className={`flex-1 bg-[#0b0724] border ${
                        newQuestion.correctIndex === idx
                          ? "border-cyan-500/50"
                          : "border-white/10"
                      } rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500`}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500 mt-1 pl-7">
                  * Select the radio button to mark the correct answer.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuestion}
                disabled={savingQuestion}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {savingQuestion && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Question Dialog */}
      <AlertDialog
        open={!!questionToDelete}
        onOpenChange={(open: boolean) => !open && setQuestionToDelete(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this question? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteQuestion}
              className="bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
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
