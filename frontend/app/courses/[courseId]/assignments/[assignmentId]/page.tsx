"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  ExternalLink,
  AlertCircle,
  Menu,
  Lock,
  BookOpen,
  Trophy,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from "@/components/ui/sheet";
import CertificateClaimCard from "@/components/student/CertificateClaimCard";
import { toast } from "sonner";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FileSubmissionManager,
  getFileIcon,
} from "@/components/lms/FileSubmissionManager";

export default function AssignmentDetailPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const assignmentId = params?.assignmentId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<any[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (assignment?.submission?.fileUrl) {
      try {
        const parsed = JSON.parse(assignment.submission.fileUrl);
        if (Array.isArray(parsed)) {
          setStagedFiles(parsed);
        } else {
          // Fallback for legacy single-file strings
          setStagedFiles([
            {
              name:
                assignment.submission.fileUrl.split("/").pop() || "Submission",
              url: assignment.submission.fileUrl,
              size: 0,
              type: "unknown",
              createdAt: assignment.submission.createdAt,
            },
          ]);
        }
      } catch (e) {
        // Not JSON, handle as simple string
        setStagedFiles([
          {
            name:
              assignment.submission.fileUrl.split("/").pop() || "Submission",
            url: assignment.submission.fileUrl,
            size: 0,
            type: "unknown",
            createdAt: assignment.submission.createdAt,
          },
        ]);
      }
    }
  }, [assignment]);

  useEffect(() => {
    fetchAssignment();
    fetchCourseData();
  }, [assignmentId, courseId]);

  const fetchCourseData = async () => {
    try {
      if (!courseId) return;
      const res = await api.get(`/lms/courses/${courseId}`);
      if (res.data.ok && res.data.data) {
        setCourse(res.data.data);
        setIsEnrolled(!!res.data.data.isEnrolled);
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
    }
  };

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lms/assignments/${assignmentId}`);
      if (res.data.data) {
        const assign = res.data.data;
        setAssignment(assign);

        // Check for active timer
        if (
          assign.duration &&
          assign.submission?.startedAt &&
          !assign.submission?.submittedAt
        ) {
          const startTime = new Date(assign.submission.startedAt).getTime();
          const durationMs = assign.duration * 60 * 1000;
          const endTime = startTime + durationMs;
          const remaining = Math.max(
            0,
            Math.floor((endTime - Date.now()) / 1000)
          );

          if (remaining > 0) {
            setTimeLeft(remaining);
            setTimerActive(true);
          } else {
            // Time already out but not submitted, maybe auto-submit?
            setTimeLeft(0);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load assignment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedFiles.length === 0) {
      return toast.error(
        "Please add at least one file to your workspace before submitting."
      );
    }

    try {
      setSubmitting(true);

      const payload = {
        assignmentId,
        fileUrl: JSON.stringify(stagedFiles),
      };

      if (isEditing && assignment.submission) {
        await api.patch(
          `/lms/assignments/submissions/${assignment.submission.id}`,
          payload
        );
        toast.success("Submission updated successfully!");
      } else {
        await api.post("/lms/assignments/submit", payload);
        toast.success("Assignment turned in successfully!");
      }

      setIsEditing(false);
      fetchAssignment(); // Refresh to show status
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!assignment?.submission) return;
    if (!confirm("Are you sure you want to remove your submission?")) return;

    try {
      setSubmitting(true);
      await api.delete(
        `/lms/assignments/submissions/${assignment.submission.id}`
      );
      toast.success("Submission removed");
      fetchAssignment();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to remove");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAssignment = async () => {
    try {
      setSubmitting(true);
      await api.post(`/lms/assignments/${assignmentId}/start`);
      toast.success("Assignment session initiated!");
      await fetchAssignment();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to start session");
    } finally {
      setSubmitting(false);
    }
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleAutoSubmit();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleAutoSubmit = async () => {
    toast.error("Time is up! Auto-submitting current state...");
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      await api.post("/lms/assignments/submit", formData);
      toast.success("Session closed and submitted.");
      await fetchAssignment();
    } catch (error) {
      console.error("Auto-submit failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isOwner = user?.id === course?.teacherId;
  const isAdmin = user?.role === "admin";
  const canAccessSide = isEnrolled || isOwner || isAdmin;

  const getAllLessons = () => {
    if (!course) return [];
    if (course.modules) {
      return course.modules.flatMap((m: any) => m.lessons || []);
    }
    return course.lessons || [];
  };

  const renderSidebarContent = () => {
    const allLessons = getAllLessons();

    return (
      <>
        <div className="p-6 border-b border-white/5 bg-[#0d0b2f]">
          <h2 className="font-bold text-white text-lg leading-tight line-clamp-2">
            {course.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <BookOpen size={12} />
            <span>{allLessons.length} Lessons</span>
          </div>

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
          {course.modules && course.modules.length > 0
            ? course.modules.map((module: any) => (
                <div key={module.id} className="space-y-1">
                  <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">
                    {module.title}
                  </h3>
                  {module.lessons?.map((lesson: any, idx: number) => {
                    const isLocked = !canAccessSide && !lesson.isFreePreview;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => router.push(`/courses/${courseId}`)}
                        className="w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group hover:bg-white/5 border border-transparent"
                      >
                        <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-slate-600 text-slate-600 group-hover:border-slate-400 group-hover:text-slate-400">
                          {isLocked ? (
                            <Lock size={10} />
                          ) : (
                            <span className="text-[10px]">
                              {lesson.position || idx + 1}
                            </span>
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
                </div>
              ))
            : course.lessons?.map((lesson: any, idx: number) => {
                const isLocked = !canAccessSide && !lesson.isFreePreview;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => router.push(`/courses/${courseId}`)}
                    className="w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group hover:bg-white/5 border border-transparent"
                  >
                    <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-slate-600 text-slate-500">
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

          <div className="pt-4 mt-4 border-t border-white/5 px-2">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group bg-purple-500/20 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-purple-500 border-purple-500 text-white border">
                <FileText size={10} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold leading-tight text-purple-300 transition-colors uppercase tracking-wide">
                  Assignments
                </h4>
              </div>
            </button>
          </div>

          {course.exam && course.exam.isEnabled && (
            <div className="mt-1 px-2">
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
                </div>
              </Link>
            </div>
          )}
        </div>
      </>
    );
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

  if (!assignment) {
    return (
      <div className="min-h-screen bg-[#0b0724] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <p>Assignment not found.</p>
          <Link
            href={`/courses/${courseId}`}
            className="mt-4 text-cyan-400 hover:text-cyan-300"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const submission = assignment.submission;
  const isPending = submission?.status === "PENDING";
  const isGraded =
    submission?.status === "GRADED" || submission?.status === "APPROVED";
  const isRejected = submission?.status === "REJECTED";

  return (
    <div className="min-h-screen bg-[#0b0724] text-slate-200 flex flex-col font-sans pt-20">
      <Navbar />

      <div className="flex flex-1 relative max-w-[1600px] mx-auto w-full">
        {/* --- LEFT SIDEBAR (DESKTOP) --- */}
        {course && (
          <aside className="hidden lg:flex flex-col w-80 bg-[#0d0b2f]/50 border-r border-white/5 sticky top-20 h-[calc(100vh-80px)] overflow-hidden">
            {renderSidebarContent()}
          </aside>
        )}

        <main className="flex-1 min-w-0 p-6 md:p-12">
          {/* Mobile Menu Trigger & Course Title Banner */}
          <div className="lg:hidden mb-8 flex items-center justify-between bg-[#0f172a] border border-white/10 p-4 rounded-2xl">
            <div className="min-w-0">
              <h2 className="text-white font-bold truncate text-sm">
                {course?.title || "Course"}
              </h2>
              <p className="text-purple-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Assignment View
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2.5 bg-[#0d0b2f] border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-purple-500/50 transition-all">
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
                    Select a lesson or assignment.
                  </SheetDescription>
                </SheetHeader>
                {course && renderSidebarContent()}
              </SheetContent>
            </Sheet>
          </div>
          {/* Assignment Header */}
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex items-start gap-6 mb-8 relative pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/courses/${courseId}`)}
                className="h-14 w-14 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:text-white transition-all shadow-xl group/back flex items-center justify-center flex-shrink-0 mt-1"
                title="Return to Course"
              >
                <ArrowLeft
                  size={28}
                  className="group-hover:-translate-x-1 transition-transform"
                />
              </Button>
              <div className="min-w-0 flex-1">
                <h4 className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">
                  {assignment.module?.title || "Assignment"}
                </h4>
                <h1 className="text-3xl font-bold text-white leading-tight">
                  {assignment.title}
                </h1>
              </div>
            </div>

            <div className="prose prose-invert prose-p:text-slate-300 max-w-none">
              <p>{assignment.description}</p>
            </div>
          </div>

          {/* Submission Section */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column: Form or Status */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">
                  Your Submission
                </h3>

                {!submission && assignment.duration ? (
                  // Start Button if duration exists but not started
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <Clock size={32} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-bold">
                        Time Limited Assignment
                      </h3>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        Once started, you will have {assignment.duration}{" "}
                        minutes to complete and submit your work.
                      </p>
                    </div>
                    <Button
                      onClick={handleStartAssignment}
                      disabled={submitting}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-10 rounded-xl"
                    >
                      {submitting && (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      )}
                      Begin_Assignment
                    </Button>
                  </div>
                ) : !submission ||
                  (assignment.duration && !submission.submittedAt) ? (
                  // Submit Form (if not submitted yet, or within duration)
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {timeLeft !== null && (
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-between animate-pulse mb-4">
                        <div className="flex items-center gap-2 text-orange-400 font-bold uppercase text-[10px] tracking-widest">
                          <Clock size={16} /> Time_Remaining
                        </div>
                        <div className="text-xl font-black text-orange-500 font-mono">
                          {formatTime(timeLeft)}
                        </div>
                      </div>
                    )}

                    <FileSubmissionManager
                      assignmentId={assignmentId}
                      files={stagedFiles}
                      onFilesChange={setStagedFiles}
                      disabled={submitting}
                    />

                    <Button
                      type="submit"
                      disabled={
                        submitting || (stagedFiles.length === 0 && !isEditing)
                      }
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 rounded-xl mt-6"
                    >
                      {submitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {submission ? "Update Submission" : "Turn In Assignment"}
                    </Button>
                  </form>
                ) : (
                  // Submission Status (already submitted)
                  <div className="space-y-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden font-sans">
                      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Submitted Artifacts
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(submission.createdAt).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        {stagedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0 group-hover:scale-110 transition-transform">
                                {getFileIcon(file.type, 20)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                                  {file.type || "binary/file"}
                                </p>
                              </div>
                            </div>
                            <a
                              href={
                                file.url.startsWith("http")
                                  ? file.url
                                  : `http://localhost:4000${file.url}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                              title="Download/View"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Edit/Remove Options (Only if Pending) */}
                    {isPending && (
                      <div className="pt-4 border-t border-white/5 flex gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                          onClick={() => setIsEditing(true)}
                          disabled={submitting}
                        >
                          Edit Submission
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-900/50 text-red-400 hover:bg-red-950/30"
                          onClick={handleDeleteSubmission}
                          disabled={submitting}
                        >
                          Remove
                        </Button>
                      </div>
                    )}

                    {!isPending && !isGraded && (
                      <p className="text-xs text-slate-500 italic">
                        This submission is being processed or rejected. Contact
                        instructor to reset.
                      </p>
                    )}
                  </div>
                )}

                {/* Edit Form Overlay (Simple reuse of submission logic) */}
                {isEditing && (
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-bold">Update Workspace</h4>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs text-slate-500 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <FileSubmissionManager
                        assignmentId={assignmentId}
                        files={stagedFiles}
                        onFilesChange={setStagedFiles}
                        disabled={submitting}
                      />
                      <Button
                        type="submit"
                        disabled={submitting || stagedFiles.length === 0}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 rounded-xl mt-6"
                      >
                        {submitting && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Status Card */}
            <div className="md:col-span-1">
              <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6 sticky top-24">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">
                  Status
                </h3>

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  {!submission ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <Clock size={32} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">Not Submitted</h4>
                        <p className="text-slate-500 text-sm">
                          Pending your action
                        </p>
                      </div>
                    </>
                  ) : isPending ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 animate-pulse">
                        <Clock size={32} />
                      </div>
                      <div>
                        <h4 className="text-yellow-400 font-bold">
                          Pending Review
                        </h4>
                        <p className="text-slate-500 text-sm">
                          Instructor is reviewing
                        </p>
                      </div>
                    </>
                  ) : isGraded ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle size={32} />
                      </div>
                      <div>
                        <h4 className="text-green-400 font-bold">Graded</h4>
                        <p className="text-slate-500 text-sm">
                          Score: {submission.grade || "N/A"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle size={32} />
                      </div>
                      <div>
                        <h4 className="text-red-400 font-bold">Returned</h4>
                        <p className="text-slate-500 text-sm">
                          Action required
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Feedback Section */}
                {submission?.feedback && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                      Instructor Feedback
                    </h4>
                    <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded text-sm text-purple-200 italic">
                      "{submission.feedback}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
