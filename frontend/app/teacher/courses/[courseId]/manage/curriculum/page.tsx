"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  GripVertical,
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

export default function CurriculumPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<
    Record<string, boolean>
  >({});

  // State for creating new items
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null); // Chapter ID
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = () => {
    setLoading(true);
    // Use courseId
    api
      .get(`/lms/teacher/courses/${courseId}`)
      .then((res) => {
        setChapters(res.data.data.chapters || []);
        // Auto expand all for now
        const expanded: Record<string, boolean> = {};
        res.data.data.chapters?.forEach((c: any) => (expanded[c.id] = true));
        setExpandedChapters(expanded);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;

    api
      .post("/lms/chapters", {
        title: newChapterTitle,
        courseId: courseId, // Use courseId
        order: chapters.length + 1,
      })
      .then(() => {
        setNewChapterTitle("");
        setIsAddingChapter(false);
        fetchCurriculum();
      })
      .catch((err) => toast.error("Failed to add chapter"));
  };

  const handleDeleteChapter = (id: string) => {
    setChapterToDelete(id);
  };

  const executeDeleteChapter = () => {
    if (!chapterToDelete) return;
    api
      .delete(`/lms/chapters/${chapterToDelete}`)
      .then(() => {
        fetchCurriculum();
        setChapterToDelete(null);
        toast.success("Chapter deleted");
      })
      .catch((err) => toast.error("Failed to delete chapter"));
  };

  const handleAddLesson = (chapterId: string) => {
    if (!newLessonTitle.trim()) return;

    const chapter = chapters.find((c) => c.id === chapterId);
    const order = (chapter?.lessons?.length || 0) + 1;

    api
      .post("/lms/lessons", {
        title: newLessonTitle,
        chapterId,
        order,
        content: "", // Init empty content
      })
      .then(() => {
        setNewLessonTitle("");
        setAddingLessonTo(null);
        fetchCurriculum();
      })
      .catch((err) => toast.error("Failed to add lesson"));
  };

  if (loading && chapters.length === 0)
    return (
      <div className="text-teal-400 font-mono animate-pulse">
        Loading_Curriculum...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-teal-900/30 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
            Curriculum_Builder
          </h1>
          <p className="text-teal-500/60 text-xs">
            Structure your course content.
          </p>
        </div>
        <button
          onClick={() => setIsAddingChapter(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500 text-teal-400 text-xs font-bold uppercase rounded hover:bg-teal-500 hover:text-black transition-colors"
        >
          <Plus size={14} /> Add_Chapter
        </button>
      </div>

      <div className="space-y-4">
        {chapters.length === 0 && !isAddingChapter && (
          <div className="text-center py-12 border border-dashed border-teal-900/30 rounded-lg text-teal-500/30">
            Course is empty. Start by adding a chapter.
          </div>
        )}

        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="border border-teal-900/50 bg-[#050510] rounded-lg overflow-hidden"
          >
            {/* Chapter Header */}
            <div className="flex items-center justify-between p-3 bg-teal-900/10 border-b border-teal-900/30">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleChapter(chapter.id)}
              >
                <GripVertical
                  size={14}
                  className="text-teal-500/30 cursor-grab"
                />
                <span className="text-teal-500/50">
                  {expandedChapters[chapter.id] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
                <span className="font-bold text-teal-100 uppercase text-sm tracking-wide">
                  {chapter.title}
                </span>
                <span className="text-[10px] text-teal-500/40 font-mono">
                  ({chapter.lessons?.length || 0} Lessons)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddingLessonTo(chapter.id)}
                  className="p-1 px-2 text-[10px] uppercase border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded opacity-60 hover:opacity-100 transition-opacity"
                >
                  + Lesson
                </button>
                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="p-1 text-red-500/50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Lessons List */}
            {expandedChapters[chapter.id] && (
              <div className="p-2 space-y-2 bg-[#02020a]">
                {chapter.lessons?.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-2 rounded border border-teal-900/20 bg-teal-900/5 hover:border-teal-500/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical
                        size={12}
                        className="text-teal-500/20 cursor-grab"
                      />
                      {lesson.videoPath ? (
                        <Video size={14} className="text-blue-400" />
                      ) : (
                        <FileText size={14} className="text-slate-400" />
                      )}
                      <span className="text-sm text-teal-100/80 group-hover:text-teal-100 transition-colors">
                        {lesson.title}
                      </span>
                      <span
                        className={`text-[10px] px-1 rounded ${
                          lesson.isPublished
                            ? "bg-green-900/30 text-green-400"
                            : "bg-yellow-900/30 text-yellow-500"
                        }`}
                      >
                        {lesson.isPublished ? "PUB" : "DRAFT"}
                      </span>
                    </div>
                    <Link
                      href={`/teacher/courses/${courseId}/manage/lessons/${lesson.id}`}
                      className="px-3 py-1 bg-black border border-teal-900 text-teal-400 text-[10px] uppercase font-bold rounded hover:border-teal-500 transition-colors"
                    >
                      Edit_Content
                    </Link>
                  </div>
                ))}

                {/* Add Lesson Form */}
                {addingLessonTo === chapter.id && (
                  <div className="flex items-center gap-2 p-2 bg-teal-900/20 rounded animate-in fade-in slide-in-from-top-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Lesson Title..."
                      className="flex-1 bg-black border border-teal-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddLesson(chapter.id)
                      }
                    />
                    <button
                      onClick={() => handleAddLesson(chapter.id)}
                      className="text-teal-400 text-xs font-bold uppercase hover:underline"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingLessonTo(null)}
                      className="text-red-400 text-xs font-bold uppercase hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Chapter Form */}
        {isAddingChapter && (
          <div className="border border-dashed border-teal-500 bg-teal-900/10 p-4 rounded-lg flex items-center gap-3">
            <span className="text-teal-400 font-bold uppercase text-xs">
              New Chapter:
            </span>
            <input
              autoFocus
              type="text"
              placeholder="Chapter Title (e.g. Introduction)"
              className="flex-1 bg-[#050510] border border-teal-900 rounded px-3 py-2 text-sm text-white focus:border-teal-500 outline-none"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
            />
            <button
              onClick={handleAddChapter}
              className="px-4 py-2 bg-teal-500 text-black font-bold uppercase text-xs rounded hover:bg-teal-400"
            >
              Create
            </button>
            <button
              onClick={() => setIsAddingChapter(false)}
              className="px-4 py-2 text-red-400 font-bold uppercase text-xs hover:text-red-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!chapterToDelete}
        onOpenChange={(open: boolean) => !open && setChapterToDelete(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-teal-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this chapter? All lessons inside
              will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-teal-900 text-teal-400 hover:bg-teal-900/20 hover:text-teal-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteChapter}
              className="bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Delete Chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
