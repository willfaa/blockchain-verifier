"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  PlayCircle,
  FileText,
  Save,
  Eye,
  Edit3,
  Plus,
  CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import RichTextEditor from "@/components/features/RichTextEditor";
import VideoPlayer from "@/components/features/VideoPlayer"; // Dynamic import wrapper

export default function CourseEditorPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [content, setContent] = useState("");
  const [isStudentView, setIsStudentView] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch Data
  useEffect(() => {
    // Mock Data for now, eventually call API: /courses/:id
    // But since backend Logic for full nested lessons might not be fully ready in `getCourseDetail` with content?
    // Let's assume `getCourseDetail` returns lessons without full content for list, and we fetch detail on click?
    // Or just fetch all.
    async function fetchCourse() {
      if (!courseId) return;
      try {
        const res = await api.get(`/courses/${courseId}`);
        if (res.data.ok) {
          setCourse(res.data.data);
          if (res.data.data.lessons?.length > 0) {
            // Auto select first lesson
            setActiveLesson(res.data.data.lessons[0]);
            setContent(res.data.data.lessons[0].content || "");
          }
        }
      } catch (e) {
        console.error("Fetch Error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  // Handle Lesson Click
  const handleSelectLesson = (lesson: any) => {
    // Save current progress if modified? (Skip for MVP)
    setActiveLesson(lesson);
    setContent(lesson.content || "");
  };

  // Handle Save
  const handleSave = async () => {
    if (!activeLesson) return;
    setSaving(true);
    try {
      // TODO: Add Endpoint PUT /lessons/:id
      // const res = await api.put(`/lessons/${activeLesson.id}`, { content });
      await new Promise((r) => setTimeout(r, 1000));
      alert("Lesson Content Saved! (Mock)");
    } catch (e) {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading Course...</div>;
  if (!course) return <div className="p-10 text-white">Course not found</div>;

  return (
    <div className="flex bg-[#0b0724] h-[calc(100vh-100px)] overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
      {/* --- INNER SIDEBAR: LESSONS --- */}
      <div className="w-80 bg-[#0d0b2f]/60 backdrop-blur-xl border-r border-white/5 flex flex-col p-4">
        <div className="mb-6">
          <h2
            className="text-lg font-bold text-white mb-1 line-clamp-1"
            title={course.title}
          >
            {course.title}
          </h2>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            Course Modules
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {course.lessons &&
            course.lessons.map((lesson: any, idx: number) => (
              <button
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${
                  activeLesson?.id === lesson.id
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10"
                    : "bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activeLesson?.id === lesson.id
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    <span className="font-bold text-sm">{idx + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold line-clamp-1">
                      {lesson.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlayCircle size={10} className="text-fuchsia-400" />
                      <span className="text-[10px] text-slate-500">
                        {lesson.duration || "10"} mins
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>

        <button className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
          <Plus size={16} />
          Add New Lesson
        </button>
      </div>

      {/* --- MAIN CONTENT: EDITOR/PREVIEW --- */}
      <div className="flex-1 flex flex-col h-full bg-[#0b0724]/90 relative">
        {/* Toolbar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0b2f]/40 backdrop-blur-md z-10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FileText size={18} className="text-cyan-400" />
            {activeLesson?.title || "Select a Lesson"}
          </h3>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setIsStudentView(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  !isStudentView
                    ? "bg-cyan-500 text-slate-950 shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 size={14} /> Teacher
              </button>
              <button
                onClick={() => setIsStudentView(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isStudentView
                    ? "bg-fuchsia-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye size={14} /> Student View
              </button>
            </div>

            {!isStudentView && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-950 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Video Player Section */}
            {activeLesson?.videoPath && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 ring-1 ring-white/5">
                <VideoPlayer
                  url={`http://localhost:4000${activeLesson.videoPath}`}
                />
              </div>
            )}

            {/* Content Editor */}
            <div className="">
              {!isStudentView && (
                <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Lesson Content</span>
                  <span className="text-cyan-400">
                    Markdown / Rich Text Supported
                  </span>
                </div>
              )}

              <RichTextEditor
                value={content}
                onChange={setContent}
                readOnly={isStudentView}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
