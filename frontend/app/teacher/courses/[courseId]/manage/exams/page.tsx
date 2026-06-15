"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Plus, Trash2, Edit, CheckCircle, Clock, FileText } from "lucide-react";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/features/RichTextEditor";

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  points: number;
  options: Option[];
}

export default function ExamManagementPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Current Question Editing
  const [qText, setQText] = useState("");
  const [qPoints, setQPoints] = useState(10);
  const [currentOptions, setCurrentOptions] = useState<Option[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  useEffect(() => {
    fetchExams();
  }, [courseId]);

  const fetchExams = async () => {
    try {
      const res = await api.get(`/lms/courses/${courseId}/exam`);
      setExams(res.data.data ? [res.data.data] : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (currentOptions.length < 5) {
      setCurrentOptions([...currentOptions, { text: "", isCorrect: false }]);
    }
  };

  const updateOption = (index: number, field: keyof Option, value: any) => {
    const newOpts = [...currentOptions];
    if (field === "isCorrect") {
      // Radio behavior: only one correct
      newOpts.forEach((o) => (o.isCorrect = false));
      newOpts[index].isCorrect = true;
    } else {
      (newOpts[index] as any)[field] = value;
    }
    setCurrentOptions(newOpts);
  };

  const addQuestion = () => {
    if (!qText) return toast.error("Question text required");
    if (!currentOptions.some((o) => o.isCorrect))
      return toast.error("Select correct answer");
    if (currentOptions.some((o) => !o.text))
      return toast.error("Fill all options");

    setQuestions([
      ...questions,
      { text: qText, points: qPoints, options: currentOptions },
    ]);

    // Reset Form
    setQText("");
    setQPoints(10);
    setCurrentOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
    toast.success("Question added!");
  };

  const handleCreateExam = async () => {
    if (!title) return toast.error("Exam Title is required");
    if (questions.length === 0) return toast.error("Add at least one question");

    try {
      await api.post(`/lms/courses/${courseId}/exam`, {
        title,
        description,
        duration,
        passingScore,
        questions,
      });
      toast.success("Exam Created Successfully!");
      setShowModal(false);
      fetchExams();
      // Reset
      setTitle("");
      setDescription("");
      setQuestions([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create exam");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-teal-900/30 pb-4">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Exams
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded shadow-lg transition-all"
        >
          <Plus size={18} /> Creates New Exam
        </button>
      </div>

      {loading ? (
        <div className="text-teal-400 animate-pulse">Loading Exams...</div>
      ) : (
        <div className="grid gap-4">
          {exams.length === 0 && (
            <p className="text-slate-500 italic">No exams created yet.</p>
          )}
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-[#050510] border border-teal-900/30 p-4 rounded flex justify-between items-center group hover:border-teal-500/50 transition-all"
            >
              <div>
                <h3 className="text-lg font-bold text-teal-100">
                  {exam.title}
                </h3>
                <div className="flex gap-4 text-xs text-slate-400 mt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {exam.duration}m
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> {exam.questionCount} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} /> Pass: {exam.passingScore}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-slate-800 text-teal-400 rounded hover:bg-slate-700">
                  <Edit size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0b0724] border border-teal-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-teal-900/50 flex justify-between items-center sticky top-0 bg-[#0b0724] z-10">
              <h2 className="text-xl font-bold text-white">Create New Exam</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-red-400"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* STEP 1: EXAM DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-2">
                  <label className="text-xs uppercase text-teal-500 font-bold">
                    Exam Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/50 border border-teal-900/50 rounded p-2 text-white"
                    placeholder="e.g. Final Exam"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-teal-500 font-bold">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-black/50 border border-teal-900/50 rounded p-2 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-teal-500 font-bold">
                    Passing Score
                  </label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full bg-black/50 border border-teal-900/50 rounded p-2 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase text-teal-500 font-bold">
                    Description
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/50 border border-teal-900/50 rounded p-2 text-white"
                  />
                </div>
              </div>

              {/* STEP 2: ADD QUESTIONS */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-teal-400 border-b border-teal-900/50 pb-2">
                  Question Builder
                </h3>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-4 p-4 bg-teal-900/10 border border-teal-500/20 rounded-lg">
                    {/* Replaced textarea with Rich Text Editor to support Images */}
                    <div className="bg-[#050510] border border-teal-900/50 rounded overflow-hidden">
                      <RichTextEditor value={qText} onChange={setQText} />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase text-slate-400 font-bold">
                        Answer Options
                      </p>
                      {currentOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() =>
                              updateOption(idx, "isCorrect", true)
                            }
                            className="accent-teal-500 cursor-pointer"
                          />
                          <input
                            value={opt.text}
                            onChange={(e) =>
                              updateOption(idx, "text", e.target.value)
                            }
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 bg-black/30 border border-teal-900/30 rounded p-2 text-sm text-white focus:border-teal-500/50"
                          />
                        </div>
                      ))}
                      {currentOptions.length < 5 && (
                        <button
                          onClick={addOption}
                          className="text-xs text-teal-500 hover:underline"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-slate-400">
                          Points:
                        </span>
                        <input
                          type="number"
                          value={qPoints}
                          onChange={(e) => setQPoints(Number(e.target.value))}
                          className="w-16 bg-black/50 border border-teal-900/50 rounded p-1 text-center text-white"
                        />
                      </div>
                      <button
                        onClick={addQuestion}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-sm"
                      >
                        Add Question
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW LIST */}
                  <div className="w-1/3 bg-black/20 border border-white/5 rounded-lg p-4 h-[400px] overflow-y-auto">
                    <h4 className="text-sm font-bold text-slate-400 mb-4">
                      Questions ({questions.length})
                    </h4>
                    <div className="space-y-2">
                      {questions.map((q, i) => (
                        <div
                          key={i}
                          className="p-2 bg-white/5 rounded border border-white/5 text-xs text-slate-300"
                        >
                          <p className="font-bold truncate">
                            {i + 1}. {q.text}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {q.options.length} options • {q.points} pts
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-teal-900/50 flex justify-end gap-3 sticky bottom-0 bg-[#0b0724]">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded border border-white/10 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExam}
                className="px-6 py-2 rounded bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-bold hover:shadow-lg shadow-teal-500/20"
              >
                Save Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
