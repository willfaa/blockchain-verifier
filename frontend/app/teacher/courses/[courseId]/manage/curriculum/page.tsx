"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  GripVertical,
  Layers,
} from "lucide-react";
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";

export default function CurriculumPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  // State for creating new items
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCurriculum();
  }, [courseId]);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/courses/${courseId}`);
      const data = res.data.data;
      setModules(data.modules || []);

      // Auto expand first module if none expanded
      if (
        Object.keys(expandedModules).length === 0 &&
        data.modules?.length > 0
      ) {
        setExpandedModules({ [data.modules[0].id]: true });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load curriculum");
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await api.post(`/lms/courses/${courseId}/modules`, {
        title: newModuleTitle,
      });
      setNewModuleTitle("");
      setIsAddingModule(false);
      fetchCurriculum();
      toast.success("Module created successfully");
    } catch (err) {
      toast.error("Failed to create module");
    }
  };

  const executeDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await api.delete(`/lms/modules/${moduleToDelete}`);
      toast.success("Module permanently removed");
      setModuleToDelete(null);
      fetchCurriculum();
    } catch (err) {
      toast.error("Failed to delete module");
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    try {
      await api.post(`/lms/modules/${moduleId}/lessons`, {
        title: newLessonTitle,
      });
      setNewLessonTitle("");
      setAddingLessonTo(null);
      fetchCurriculum();
      toast.success("Lesson added successfully");
    } catch (err) {
      toast.error("Failed to add lesson");
    }
  };

  if (loading && modules.length === 0)
    return <CyberpunkLoader text="Loading Curriculum..." />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            Course Curriculum
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-[0.2em] mt-1">
            Manage your course modules and lessons
          </p>
        </div>
        <button
          onClick={() => setIsAddingModule(true)}
          className="group flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 text-white font-black uppercase tracking-widest text-[10px] rounded-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
        >
          <Plus
            size={14}
            className="group-hover:text-cyan-400 transition-colors"
          />{" "}
          New Module
        </button>
      </div>

      <div className="space-y-6">
        {modules.length === 0 && !isAddingModule ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-3xl bg-white/[0.01] group">
            <Layers
              className="text-white/10 mb-4 group-hover:text-cyan-500/30 transition-colors"
              size={48}
            />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
              Your curriculum is empty
            </p>
            <button
              onClick={() => setIsAddingModule(true)}
              className="mt-6 text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
            >
              [ Create your first module to get started ]
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((moduleItem, index) => (
              <div
                key={moduleItem.id}
                className={`group border transition-all duration-300 rounded-2xl overflow-hidden ${
                  expandedModules[moduleItem.id]
                    ? "bg-white/[0.03] border-white/10 shadow-2xl"
                    : "bg-white/[0.01] border-white/5 hover:border-white/20"
                }`}
              >
                {/* Module Header */}
                <div className="flex items-center justify-between p-5 select-none transition-colors border-b border-white/[0.05]">
                  <div
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => toggleModule(moduleItem.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono text-xs text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all border border-white/5">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase text-[13px] tracking-widest group-hover:text-cyan-400 transition-colors">
                        {moduleItem.title}
                      </h3>
                      <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                        LESSONS: {moduleItem.lessons?.length || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAddingLessonTo(moduleItem.id)}
                      className="px-3 py-1.5 text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded transition-all tracking-widest"
                    >
                      + Lesson
                    </button>
                    <button
                      onClick={() => setModuleToDelete(moduleItem.id)}
                      className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="w-px h-6 bg-white/5 mx-1" />
                    <button
                      onClick={() => toggleModule(moduleItem.id)}
                      className="p-1 text-white/40 group-hover:text-white transition-colors"
                    >
                      {expandedModules[moduleItem.id] ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                {expandedModules[moduleItem.id] && (
                  <div className="p-4 space-y-3 bg-black/40 animate-in slide-in-from-top-2 duration-300">
                    {moduleItem.lessons?.length === 0 && !addingLessonTo && (
                      <p className="text-center py-6 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
                        No lessons found in this module
                      </p>
                    )}

                    {moduleItem.lessons?.map((lesson: any, lIdx: number) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all group/lesson shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] font-mono text-white/20 w-4">
                            {lIdx + 1}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover/lesson:text-cyan-400 transition-colors">
                            {lesson.videoUrl ? (
                              <Video size={14} />
                            ) : (
                              <FileText size={14} />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-300 group-hover/lesson:text-white transition-colors leading-none">
                              {lesson.title}
                            </span>
                            <div className="flex gap-2 mt-1">
                              <span
                                className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                                  lesson.isPublished
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-fuchsia-500/10 text-fuchsia-400"
                                }`}
                              >
                                {lesson.isPublished ? "Active" : "Static"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/teacher/courses/${courseId}/manage/lessons/${lesson.id}`}
                          className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all"
                        >
                          Edit Lesson
                        </Link>
                      </div>
                    ))}

                    {/* Add Lesson Form */}
                    {addingLessonTo === moduleItem.id && (
                      <div className="flex items-center gap-3 p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20 animate-in fade-in slide-in-from-top-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Lesson Title"
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                          value={newLessonTitle}
                          onChange={(e) => setNewLessonTitle(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddLesson(moduleItem.id)
                          }
                        />
                        <button
                          onClick={() => handleAddLesson(moduleItem.id)}
                          className="px-4 py-2 bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest rounded hover:brightness-110 active:scale-95 transition-all"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setAddingLessonTo(null);
                            setNewLessonTitle("");
                          }}
                          className="text-white/40 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Module Form */}
        {isAddingModule && (
          <div className="border border-dashed border-cyan-500/50 bg-cyan-500/[0.02] p-6 rounded-3xl flex flex-col md:flex-row items-center gap-4 animate-in zoom-in-95">
            <div className="flex-1 w-full">
              <label className="text-cyan-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2 block">
                Initialize New Module
              </label>
              <input
                autoFocus
                type="text"
                placeholder="TITLE"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none font-mono transition-all"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
              />
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-5">
              <button
                onClick={handleAddModule}
                className="px-8 py-3 bg-cyan-500 text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsAddingModule(false);
                  setNewModuleTitle("");
                }}
                className="px-6 py-3 text-white/40 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!moduleToDelete}
        onOpenChange={(open: boolean) => !open && setModuleToDelete(null)}
      >
        <AlertDialogContent className="bg-[#0b0724] border border-white/10 text-white rounded-3xl shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
              Delete Module?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              You are about to permanently delete this module. All lessons
              contained within will be removed from the curriculum. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteModule}
              className="bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
