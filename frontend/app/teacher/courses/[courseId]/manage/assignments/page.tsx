"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  FileText,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { CyberpunkLoader } from "@/components/ui/CyberpunkLoader";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
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

export default function AssignmentManagePage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null); // If null, mode is Create
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [dueDate, setDueDate] = useState("");
  const [duration, setDuration] = useState<number | "">("");

  // Delete State
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);
  const [moduleToDelete, setModuleToDelete] = useState<any>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lms/courses/${courseId}`);
      const data = res.data.data;
      setCourse(data);

      // Auto expand all
      const expanded: Record<string, boolean> = {};
      // UPDATED: chapters -> modules
      data.modules?.forEach((m: any) => (expanded[m.id] = true));
      setExpandedModules(expanded);
    } catch (err) {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateDialog = (moduleId: string) => {
    setEditingAssignment(null);
    setSelectedModuleId(moduleId);
    setTitle("");
    setDescription("");
    setMaxScore(100);
    setDueDate("");
    setDuration("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (assignment: any, moduleId: string) => {
    setEditingAssignment(assignment);
    setSelectedModuleId(moduleId);
    setTitle(assignment.title);
    setDescription(assignment.description || "");
    setMaxScore(assignment.maxScore || 100);
    setDueDate(
      assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().split("T")[0]
        : ""
    );
    setDuration(assignment.duration || "");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title) return toast.error("Title is required");

    try {
      if (editingAssignment) {
        // Update
        await api.put(`/lms/assignments/${editingAssignment.id}`, {
          title,
          description,
          maxScore,
          dueDate: dueDate || null,
          duration: duration || null,
        });
        toast.success("Assignment updated");
      } else {
        // Create
        if (!selectedModuleId) return;
        await api.post("/lms/assignments", {
          moduleId: selectedModuleId, // UPDATED: Send moduleId
          title,
          description,
          maxScore,
          dueDate: dueDate || null,
          duration: duration || null,
        });
        toast.success("Assignment created");
      }
      setIsDialogOpen(false);
      loadCourse();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save");
    }
  };

  const toggleVisibility = async (assignment: any) => {
    try {
      await api.put(`/lms/assignments/${assignment.id}`, {
        isVisible: !assignment.isVisible,
      });
      toast.success(
        `Assignment is now ${!assignment.isVisible ? "Visible" : "Hidden"}`
      );
      loadCourse();
    } catch (err) {
      toast.error("Failed to update visibility");
    }
  };

  const handleDelete = async () => {
    if (assignmentToDelete) {
      try {
        await api.delete(`/lms/assignments/${assignmentToDelete.id}`);
        toast.success("Assignment purged from network");
        loadCourse();
        setAssignmentToDelete(null);
      } catch (err) {
        toast.error("Delete failed");
      }
    } else if (moduleToDelete) {
      try {
        await api.delete(`/lms/modules/${moduleToDelete.id}`);
        toast.success("Module deleted");
        loadCourse();
        setModuleToDelete(null);
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  if (loading && !course)
    return <CyberpunkLoader text="Preparing Assignments..." />;
  if (!course)
    return (
      <div className="p-8 text-neon-purple font-bold text-center">
        Error: Course Records Not Found
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Curriculum <span className="text-neon-purple">Assignments</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-4">
            Coursework and Evaluation Management Hub
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {course.modules?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <ClipboardList className="text-white/10 mb-4" size={48} />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest text-center px-6">
              No modules found.
              <br />
              Initialize structure in Curriculum first.
            </p>
          </div>
        )}

        {course.modules?.map((moduleItem: any, index: number) => (
          <div
            key={moduleItem.id}
            className={`group border transition-all duration-300 rounded-2xl overflow-hidden ${
              expandedModules[moduleItem.id]
                ? "bg-white/[0.03] border-white/10 shadow-2xl"
                : "bg-white/[0.01] border-white/5 hover:border-white/20"
            }`}
          >
            {/* Module Header */}
            <div className="flex items-center justify-between p-6 select-none transition-colors border-b border-white/[0.05]">
              <div
                className="flex items-center gap-5 flex-1 cursor-pointer"
                onClick={() => toggleModule(moduleItem.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-xs text-white/40 group-hover:text-neon-blue group-hover:bg-neon-blue/10 transition-all border border-white/5">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase text-[12px] tracking-widest group-hover:text-neon-blue transition-colors">
                    {moduleItem.title}
                  </h3>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">
                    Assignments: {moduleItem.assignments?.length || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  className="bg-neon-blue/10 text-neon-blue border-neon-blue/20 hover:bg-neon-blue hover:text-black hover:border-neon-blue h-9 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg"
                  onClick={() => openCreateDialog(moduleItem.id)}
                >
                  <Plus size={14} className="mr-2" /> Add Assignment
                </Button>
                <button
                  onClick={() => setModuleToDelete(moduleItem)}
                  className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Wipe Module"
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

            {/* Assignments List */}
            {expandedModules[moduleItem.id] && (
              <div className="p-6 space-y-4 bg-white/[0.01] animate-in slide-in-from-top-2 duration-300">
                {moduleItem.assignments?.length === 0 && (
                  <p className="text-center py-8 text-[11px] text-white/20 font-bold uppercase tracking-widest">
                    No assignments found for this module.
                  </p>
                )}

                {moduleItem.assignments?.map((assign: any) => (
                  <div
                    key={assign.id}
                    className="flex flex-wrap lg:flex-nowrap items-center justify-between p-5 rounded-[1.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-neon-purple/20 transition-all group/lesson shadow-inner gap-6"
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          assign.isVisible
                            ? "bg-neon-purple/10 text-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.1)]"
                            : "bg-white/5 text-white/20"
                        }`}
                      >
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white group-hover/lesson:text-neon-purple transition-colors truncate text-sm">
                          {assign.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2">
                          <div className="flex items-center gap-2">
                            {assign.isVisible ? (
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <Eye size={10} /> Active
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                                <EyeOff size={10} /> Hidden
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/40 font-medium truncate max-w-[400px]">
                            {assign.description || "No description provided."}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 lg:mt-0 w-full lg:w-auto justify-end">
                      <Link
                        href={`/teacher/courses/${courseId}/manage/assignments/${assign.id}/submissions`}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all shadow-md group/sub"
                      >
                        <UserCheck
                          size={14}
                          className="group-hover/sub:text-neon-blue transition-colors"
                        />{" "}
                        Submissions
                      </Link>

                      <button
                        onClick={() => openEditDialog(assign, moduleItem.id)}
                        className="p-2.5 text-white/40 hover:text-neon-blue hover:bg-neon-blue/10 rounded-xl transition-all border border-white/5 hover:border-neon-blue/20"
                        title="Edit Assignment"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => toggleVisibility(assign)}
                        className={`p-2.5 rounded-xl transition-all border border-white/5 ${
                          assign.isVisible
                            ? "text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                            : "text-white/20 hover:text-white hover:bg-white/10 hover:border-white/20"
                        }`}
                        title={assign.isVisible ? "Hide" : "Show"}
                      >
                        {assign.isVisible ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => setAssignmentToDelete(assign)}
                        className="p-2.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-white/5 hover:border-red-500/20"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-dark-bg/95 border border-white/10 text-white rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl max-w-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 p-8 border-b border-white/5">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {editingAssignment ? "Update Assignment" : "New Assignment"}
            </DialogTitle>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-bold text-neon-blue tracking-widest ml-1">
                Assignment Title
              </Label>
              <Input
                value={title}
                onChange={(e: any) => setTitle(e.target.value)}
                placeholder="e.g. Final Research Paper"
                className="bg-white/5 border-white/10 focus:border-neon-purple/50 rounded-2xl h-14 font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-bold text-neon-purple tracking-widest ml-1">
                Instructions & Overview
              </Label>
              <Textarea
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                placeholder="Detailed instructions for students..."
                className="bg-white/5 border-white/10 focus:border-neon-purple/50 rounded-2xl min-h-[140px] resize-none font-medium leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold text-neon-soft-blue tracking-widest ml-1">
                  Maximum Points
                </Label>
                <Input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-white/10 focus:border-neon-purple/50 rounded-2xl h-14 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold text-neon-pink tracking-widest ml-1">
                  Submission Deadline
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-neon-purple/50 rounded-2xl h-14 text-white scheme-dark font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest ml-1">
                Time Limit (Minutes)
              </Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    e.target.value === "" ? "" : parseInt(e.target.value)
                  )
                }
                placeholder="Leave empty for no limit"
                className="bg-white/5 border-white/10 focus:border-neon-purple/50 rounded-2xl h-14 font-bold"
              />
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest ml-1">
                Once started, students must submit within this timeframe.
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="w-full h-16 bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-2xl hover:shadow-neon-purple/20 text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95"
            >
              {editingAssignment ? "Save Changes" : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!assignmentToDelete || !!moduleToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentToDelete(null);
            setModuleToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="bg-dark-bg/95 border border-white/10 text-white rounded-[2rem] shadow-3xl backdrop-blur-2xl p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold tracking-tight">
              {assignmentToDelete ? "Delete Assignment?" : "Delete Module?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/40 font-medium leading-relaxed mt-4">
              {assignmentToDelete
                ? `Are you sure you want to delete "${assignmentToDelete?.title}"? All associated student submissions and records will be permanently removed.`
                : `Are you sure you want to delete the module "${moduleToDelete?.title}"? All linked coursework and assignments will be lost. This action is irreversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all rounded-2xl px-8 h-12 font-bold text-xs uppercase tracking-widest">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl px-10 h-12 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/10"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Simple Helper for Link
function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-md text-xs font-bold hover:bg-teal-500/20 transition-colors uppercase"
    >
      {children}
    </Link>
  );
}
