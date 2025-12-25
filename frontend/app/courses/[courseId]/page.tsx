"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import VideoPlayer from "@/components/features/VideoPlayer";
import Modal from "@/components/ui/Modal";
import CertificateClaimCard from "@/components/student/CertificateClaimCard";
import {
  Loader2,
  BookOpen,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Lock,
  Eye as EyeIcon,
  ArrowLeft,
  Trophy,
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
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

export default function CourseLearningPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const router = useRouter();
  const { user } = useAuth();

  // existing state
  const [course, setCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // const [sidebarOpen, setSidebarOpen] = useState(true); // Unused variable removal

  // New State for Enrollment
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (activeLesson) {
      setTimeout(() => {
        document.querySelectorAll("pre code").forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }, 100);
    }
  }, [activeLesson]);

  const fetchCourseData = async () => {
    try {
      if (!courseId) return;
      // Corrected API endpoint as per previous task
      const res = await api.get(`/lms/courses/${courseId}`);
      if (res.data.ok && res.data.data) {
        const data = res.data.data;
        setCourse(data);

        if (data.isEnrolled) {
          setIsEnrolled(true);
        } else {
          setIsEnrolled(false);
        }

        // Handle Chapters vs Direct Lessons
        if (data.chapters && data.chapters.length > 0) {
          const firstChapter = data.chapters.find(
            (c: any) => c.lessons && c.lessons.length > 0
          );
          if (firstChapter) {
            setActiveLesson(firstChapter.lessons[0]);
          }
        } else if (data.lessons && data.lessons.length > 0) {
          setActiveLesson(data.lessons[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.id === course?.teacherId;
  const isAdmin = user?.role === "admin";
  const canAccess = isEnrolled || isOwner || isAdmin;

  // 1. Logic Gate: Triggered by user clicking "Enroll Now" on page
  const initiateEnrollment = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setEnrollModalOpen(true);
  };

  // 2. Execution: Triggered by user clicking "Confirm" in Modal
  const confirmEnrollment = async () => {
    setEnrolling(true);
    try {
      await api.post("/lms/enroll", { courseId });
      setIsEnrolled(true);
      setEnrollModalOpen(false);
    } catch (error: any) {
      if (
        error.response?.data?.error?.includes("Unique constraint failed") ||
        error.response?.data?.error?.includes("already enrolled")
      ) {
        setIsEnrolled(true);
        setEnrollModalOpen(false);
      } else {
        alert(
          "Enrollment failed: " + (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setEnrolling(false);
    }
  };

  const redirectToLogin = () => {
    router.push(`/login?redirect=/courses/${courseId}`);
  };

  const handleLessonChange = (lesson: any) => {
    // UPDATED GUARD: Allow owner/admin or if lesson is free
    if (!canAccess && !lesson.isFreePreview) {
      if (!user) {
        setShowLoginModal(true);
      } else {
        setEnrollModalOpen(true);
      }
      return;
    }
    setActiveLesson(lesson);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper to get flat list for navigation
  const getAllLessons = () => {
    if (!course) return [];
    if (course.chapters) {
      return course.chapters.flatMap((c: any) => c.lessons || []);
    }
    return course.lessons || [];
  };

  const allLessons = getAllLessons();
  const activeIndex = allLessons.findIndex(
    (l: any) => l.id === activeLesson?.id
  );

  const goToNextLesson = () => {
    // UPDATED GUARD
    if (!canAccess) {
      // Logic simplification: if they are viewing a lesson, they likely have access,
      // unless they clicked Next into a locked lesson?
      // For now, assume if they are viewing, they can navigate, BUT check next lesson lock status?
      // Let's just use the same guard.
      // Actually if they are Owner, canAccess is true.
      // If they are Student and !isEnrolled, they shouldn't be here unless Free Preview.
      // If next lesson is NOT free, trigger modal.
      // But let's keep it simple: check canAccess.
      if (!user) {
        setShowLoginModal(true);
      } else {
        setEnrollModalOpen(true); // Should we check free preview of next lesson?
        // For simplicity, enforce enrollment for navigation if not enrolled/owner.
        // Unless we want to support Free Preview navigation?
        // Let's stick to strict guard for now to be safe.
        setEnrollModalOpen(true);
      }
      return;
    }
    if (!activeLesson || allLessons.length === 0) return;
    if (activeIndex < allLessons.length - 1) {
      handleLessonChange(allLessons[activeIndex + 1]);
    }
  };

  // Same for Prev
  const goToPrevLesson = () => {
    if (!canAccess) {
      // ... same logic
      if (!user) {
        setShowLoginModal(true);
      } else {
        setEnrollModalOpen(true);
      }
      return;
    }
    if (!activeLesson || allLessons.length === 0) return;
    if (activeIndex > 0) {
      handleLessonChange(allLessons[activeIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0724] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-cyan-400">
          <Loader2 size={48} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0b0724] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <AlertCircle size={48} className="mb-4" />
          <p>Course not found.</p>
          <Link
            href="/courses"
            className="mt-4 text-cyan-400 hover:text-cyan-300"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const renderSidebarContent = () => (
    <>
      <div className="p-6 border-b border-white/5 bg-[#0d0b2f]">
        <h2 className="font-bold text-white text-lg leading-tight line-clamp-2">
          {course.title}
        </h2>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <BookOpen size={12} />
          <span>{allLessons.length} Lessons</span>
        </div>

        {/* Enrollment Status Indicator */}
        {!isOwner && !isAdmin && (
          <div
            className={`mt-4 px-3 py-1.5 rounded text-xs font-bold uppercase text-center border ${
              isEnrolled
                ? "bg-green-900/20 text-green-400 border-green-500/30"
                : "bg-orange-900/20 text-orange-400 border-orange-500/30"
            }`}
          >
            {isEnrolled ? "Enrolled" : "Preview Mode"}
          </div>
        )}

        {/* Certificate Claim Card - Shows only if Enrolled */}
        {isEnrolled && (
          <div className="mt-4">
            <CertificateClaimCard
              courseId={course.id}
              courseName={course.title}
              score={course.bestResult?.score || 0}
              status={
                course.enrollment?.certificate
                  ? "PASSED"
                  : course.bestResult?.status || "NOT_STARTED"
              }
              certificateUrl={
                course.enrollment?.certificate?.cid
                  ? `http://localhost:8080/ipfs/${course.enrollment.certificate.cid}`
                  : null
              }
              onClaimSuccess={() => fetchCourseData()}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {course.chapters && course.chapters.length > 0
          ? // Chapter-based Rendering
            course.chapters.map((chapter: any) => (
              <div key={chapter.id} className="space-y-1">
                <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                  {chapter.title}
                </h3>
                {chapter.lessons?.map((lesson: any, idx: number) => {
                  const isActive = activeLesson?.id === lesson.id;
                  const isLocked = !canAccess && !lesson.isFreePreview;

                  return (
                    <button
                      key={lesson.id} // Added key here
                      onClick={() => handleLessonChange(lesson)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${
                        isActive
                          ? "bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                          isActive
                            ? "bg-cyan-500 border-cyan-500 text-slate-950 font-bold"
                            : "border-slate-600 text-slate-600 group-hover:border-slate-400 group-hover:text-slate-400"
                        }`}
                      >
                        {isLocked ? (
                          <Lock size={10} />
                        ) : (
                          <span className="text-[10px]">
                            {lesson.order || idx + 1}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4
                          className={`text-sm font-medium leading-tight ${
                            isActive
                              ? "text-cyan-400"
                              : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          {lesson.title}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          : // Legacy Flat Rendering (Fallback)
            course.lessons?.map((lesson: any, idx: number) => {
              const isActive = activeLesson?.id === lesson.id;
              const isLocked = !canAccess && !lesson.isFreePreview;
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleLessonChange(lesson)}
                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent flex items-start gap-3 group"
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-slate-600">
                    {isLocked ? (
                      <Lock size={10} />
                    ) : (
                      <span className="text-[10px]">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium leading-tight text-slate-400 group-hover:text-slate-200">
                      {lesson.title}
                    </h4>
                  </div>
                </button>
              );
            })}

        {/* --- FINAL EXAM LINK --- */}
        {course.exam && course.exam.isEnabled && (
          <div className="pt-4 mt-4 border-t border-white/5 px-2">
            <Link
              href={`/exam/${course.exam.id}`}
              className="w-full text-left p-3 rounded-xl hover:bg-white/5 border border-transparent flex items-start gap-3 group bg-gradient-to-r from-cyan-900/10 to-transparent hover:from-cyan-900/30 transition-all"
            >
              <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-cyan-500/50 bg-cyan-900/20 text-cyan-400">
                <Trophy size={12} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold leading-tight text-cyan-100 group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                  Final Exam
                </h4>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                  {course.exam.durationMinutes} mins • Qualification
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0b0724] text-slate-200 flex flex-col font-sans">
      <Navbar />

      {/* Login Gate Modal */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Authentication Required"
        description="You must be logged in to enroll in this course. Join the chain to start learning."
        confirmText="Log In Now"
        variant="primary"
        onConfirm={redirectToLogin}
      />

      {/* Enrollment Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`Enroll in ${course.title}`}
        description="Join this course to access all lessons, quizzes, and earn your certificate on the blockchain."
        confirmText="Enroll Now"
        variant="primary"
        onConfirm={confirmEnrollment}
        isLoading={enrolling}
      />

      <div className="flex flex-1 relative max-w-[1600px] mx-auto w-full">
        {/* --- LEFT SIDEBAR (DESKTOP) --- */}
        <aside className="hidden lg:flex flex-col w-80 bg-[#0d0b2f]/50 border-r border-white/5 sticky top-20 h-[calc(100vh-80px)] overflow-hidden">
          {renderSidebarContent()}
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 min-w-0 bg-[#0b0724]">
          {/* UPDATED MAIN RENDER CONDITION: Show content if Enrolled OR Owner/Admin */}
          {!canAccess ? (
            // NOT ENROLLED (and not Owner) VIEW -> Show Landing Page
            <div className="max-w-4xl mx-auto p-10 flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <Lock size={48} className="text-cyan-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 uppercase tracking-tight">
                {course.title}
              </h1>
              <div
                className="text-slate-400 text-lg max-w-2xl mb-10 leading-relaxed prose prose-invert prose-p:text-slate-400 prose-headings:text-white"
                dangerouslySetInnerHTML={{
                  __html:
                    course.description ||
                    "Unlock your potential with this course. Enroll now to access all lessons, quizzes, and hands-on projects.",
                }}
              />

              {/* ACTION BUTTONS */}
              <button
                onClick={initiateEnrollment}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all transform hover:-translate-y-1"
              >
                Enroll Now
              </button>
            </div>
          ) : activeLesson ? (
            <div className="max-w-4xl mx-auto p-6 md:p-10 pb-32">
              {/* NEW BACK BUTTON */}
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Courses</span>
              </Link>

              {/* Navigation Header (Mobile Only) */}
              <div className="lg:hidden mb-6 flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1 line-clamp-1">
                    {course.title}
                  </h1>
                  <p className="text-cyan-400 font-medium flex items-center gap-2 text-sm">
                    <span className="bg-cyan-500/10 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      Lesson {activeIndex + 1}
                    </span>
                    <span className="line-clamp-1">{activeLesson.title}</span>
                  </p>
                </div>

                {/* Mobile Menu Trigger */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-2.5 bg-[#0d0b2f] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all">
                      <Menu size={20} />
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[300px] border-r border-white/10 bg-[#0b0c24] p-0"
                  >
                    <SheetHeader className="sr-only">
                      <SheetTitle>Course Navigation</SheetTitle>
                      <SheetDescription>
                        Select a lesson to navigate.
                      </SheetDescription>
                    </SheetHeader>
                    {renderSidebarContent()}
                  </SheetContent>
                </Sheet>
              </div>

              {/* Content Header */}
              <div className="mb-8 border-b border-white/5 pb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  {activeLesson.title}
                </h1>
                {/* Video Player */}
                {activeLesson.videoPath && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-900/10 mb-8 bg-black">
                    <VideoPlayer
                      url={`http://localhost:4000${activeLesson.videoPath}`}
                    />
                  </div>
                )}
              </div>

              {/* Rich Text Content */}
              <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-300 prose-p:leading-relaxed prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-code:text-fuchsia-400 prose-code:bg-fuchsia-500/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                <div
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              </div>

              {/* Navigation Footer */}
              <div className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center">
                <button
                  onClick={goToPrevLesson}
                  disabled={activeIndex <= 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                  <div className="text-left hidden md:block">
                    <span className="block text-xs uppercase tracking-wider opacity-70">
                      Previous
                    </span>
                    <span className="font-semibold">Lesson</span>
                  </div>
                </button>

                <button
                  onClick={goToNextLesson}
                  disabled={activeIndex >= allLessons.length - 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <div className="text-right hidden md:block">
                    <span className="block text-xs uppercase tracking-wider opacity-70">
                      Next
                    </span>
                    <span className="font-semibold">Next Lesson</span>
                  </div>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-[500px]">
              <p>Select a lesson to start learning.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
