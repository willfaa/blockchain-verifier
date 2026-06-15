"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Save, Video, Globe, Eye } from "lucide-react";
import RichTextEditor from "@/components/features/RichTextEditor";
import { useParams } from "next/navigation";
import { getAssetUrl } from "@/lib/utils";

export default function LessonEditorPage() {
  const params = useParams();
  const lessonId = params?.lessonId as string;
  const courseId = params?.courseId as string; // Required for file upload organization

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // HTML content from Quill
  const [isPublished, setIsPublished] = useState(false);
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchLesson();
  }, []);

  const fetchLesson = () => {
    setLoading(true);
    // lessonId is unique, no need for courseId in API unless validating
    api
      .get(`/lms/lessons/${lessonId}`)
      .then((res) => {
        const l = res.data.data;
        setLesson(l);
        setTitle(l.title);
        setContent(l.content || "");
        setIsPublished(l.isPublished);
        setIsFreePreview(l.isFreePreview);
        setCurrentVideo(l.videoUrl);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    setSaving(true);
    const data = new FormData();
    data.append("title", title);
    data.append("content", content);
    data.append("isPublished", String(isPublished));
    data.append("isFreePreview", String(isFreePreview));
    data.append("isFreePreview", String(isFreePreview));
    // CRITICAL for Upload Organization
    if (courseId) data.append("courseId", courseId);

    if (videoFile) {
      data.append("video", videoFile);
    }

    api
      .put(`/lms/lessons/${lessonId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        toast.success("Lesson Saved!");
        fetchLesson();
      })
      .catch((err) => toast.error("Failed to save lesson"))
      .finally(() => setSaving(false));
  };

  if (loading)
    return (
      <div className="text-teal-400 font-mono animate-pulse">
        Loading_Lesson_Data...
      </div>
    );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-teal-900/30 pb-4 sticky top-0 bg-[#0b0724]/90 backdrop-blur z-20">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight font-mono">
            Lesson_Editor
          </h1>
          <p className="text-teal-500/60 text-xs font-mono">
            Editing: {lesson?.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-black rounded border border-teal-900/50">
            <label className="text-[10px] uppercase text-teal-500 font-bold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-teal-500"
              />
              Published
            </label>
            <div className="h-4 w-px bg-teal-900/50 mx-1"></div>
            <label className="text-[10px] uppercase text-teal-500 font-bold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFreePreview}
                onChange={(e) => setIsFreePreview(e.target.checked)}
                className="accent-teal-500"
              />
              Free_Preview
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-black font-bold uppercase tracking-wider text-xs rounded transition-all"
          >
            <Save size={14} /> {saving ? "Saving..." : "Save_Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <label className="text-teal-500 text-xs uppercase font-bold tracking-wider font-mono">
              Lesson Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#050510] border border-teal-900/50 rounded p-3 text-teal-100 font-bold text-lg focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-teal-500 text-xs uppercase font-bold tracking-wider font-mono mb-2 block">
              Content (Rich Text)
            </label>
            <div className="bg-[#050510] border border-teal-900/50 rounded overflow-hidden min-h-[400px]">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </div>
        </div>

        {/* Sidebar: Media */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-teal-500 text-xs uppercase font-bold tracking-wider font-mono flex items-center gap-2">
              <Video size={14} /> Video_Source
            </label>
            <div className="bg-[#050510] border border-teal-900/50 rounded p-4 space-y-4">
              {currentVideo && !videoFile && (
                <div className="aspect-video bg-black rounded overflow-hidden relative group">
                  <video
                    src={getAssetUrl(currentVideo)}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded font-mono">
                    Current
                  </div>
                </div>
              )}

              <div className="relative">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-teal-900 rounded cursor-pointer hover:bg-teal-900/10 transition-colors">
                  <UploadIcon />
                  <span className="mt-2 text-[10px] uppercase text-teal-500 font-bold">
                    Upload .MP4
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="video/mp4"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setVideoFile(e.target.files[0]);
                    }}
                  />
                </label>
                {videoFile && (
                  <div className="mt-2 text-xs text-teal-300 font-mono truncate">
                    Selected: {videoFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      className="w-6 h-6 text-teal-500/50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}
