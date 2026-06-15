"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getInitials, getAvatarUrl } from "@/lib/utils";

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params?.assignmentId as string;
  const courseId = params?.courseId as string;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading State
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null); // For Sheet
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lms/assignments/${assignmentId}/submissions`);
      setSubmissions(res.data.data);
    } catch (err) {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const openGrading = (sub: any) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade?.toString() || "");
    setFeedback(sub.feedback || "");
  };

  const handleSave = async (status: string) => {
    if (!selectedSubmission) return;
    setGradingLoading(true);
    try {
      await api.put(`/lms/assignments/submissions/${selectedSubmission.id}`, {
        grade: grade,
        feedback: feedback,
        status: status,
      });

      toast.success(
        status === "APPROVED" ? "Approved & Finalized!" : "Saved successfully"
      );

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? { ...s, grade: parseFloat(grade), feedback, status }
            : s
        )
      );

      if (status === "APPROVED") {
        setSelectedSubmission(null); // Close if finalized
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Grading failed");
    } finally {
      setGradingLoading(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this submission? This cannot be undone."
      )
    )
      return;
    try {
      await api.delete(`/lms/teacher/assignments/submissions/${id}`);
      toast.success("Submission deleted");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white/40 hover:text-white bg-white/5 rounded-xl transition-all"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Submission <span className="text-neon-purple">Ledger</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-2">
            Professional Review & Academic Assessment
          </p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-[2rem] overflow-x-auto shadow-2xl backdrop-blur-xl custom-scrollbar">
        <Table>
          <TableHeader className="bg-white/[0.02] hover:bg-white/[0.02]">
            <TableRow className="border-white/5">
              <TableHead className="text-neon-blue font-bold tracking-wider uppercase text-[10px] py-4 pl-8 min-w-[200px]">
                Student
              </TableHead>
              <TableHead className="text-neon-purple font-bold tracking-wider uppercase text-[10px] py-4 whitespace-nowrap min-w-[150px]">
                Submitted At
              </TableHead>
              <TableHead className="text-white/40 font-bold tracking-tight uppercase text-[10px] py-4 whitespace-nowrap min-w-[200px]">
                Artifact
              </TableHead>
              <TableHead className="text-white/40 font-bold tracking-tight uppercase text-[10px] py-4 whitespace-nowrap min-w-[120px]">
                Status
              </TableHead>
              <TableHead className="text-white/40 font-bold tracking-tight uppercase text-[10px] py-4 whitespace-nowrap min-w-[100px]">
                Evaluation
              </TableHead>
              <TableHead className="text-white/40 font-bold tracking-tight uppercase text-[10px] py-4 text-right pr-6 whitespace-nowrap min-w-[130px]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500 italic"
                >
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub: any) => (
                <TableRow
                  key={sub.id}
                  className="border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  {/* 1. STUDENT INFO */}
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-white/10 p-0.5 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20">
                        <AvatarImage
                          src={getAvatarUrl(sub.student.avatar)}
                          className="rounded-xl object-cover"
                        />
                        <AvatarFallback className="rounded-xl bg-dark-bg text-white font-bold">
                          {getInitials(sub.student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-white tracking-tight">
                          {sub.student.name}
                        </div>
                        <div className="text-[10px] text-white/30 font-semibold truncate w-40">
                          {sub.student.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* 2. DATE */}
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                      <span className="text-white/60 text-[11px] font-bold tracking-tight">
                        {sub.submittedAt || sub.createdAt ? (
                          new Date(
                            sub.submittedAt || sub.createdAt
                          ).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span className="italic text-white/20 font-medium">
                            Pending
                          </span>
                        )}
                      </span>
                      {(sub.submittedAt || sub.createdAt) && (
                        <span className="text-white/20 text-[10px] font-semibold tracking-wider">
                          {new Date(
                            sub.submittedAt || sub.createdAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* 3. ARTIFACT (Diperlebar) */}
                  <TableCell className="py-5">
                    {(() => {
                      try {
                        const files = JSON.parse(sub.fileUrl);
                        if (Array.isArray(files)) {
                          return (
                            <div className="flex flex-col gap-1">
                              <a
                                href={files[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-neon-blue hover:text-white transition-colors text-[11px] font-bold uppercase tracking-tight"
                              >
                                <FileText size={14} className="flex-shrink-0" />
                                {/* PERBAIKAN: max-w diperbesar agar tidak terlalu sempit */}
                                <span className="truncate max-w-[250px]">
                                  {files[0].name}
                                </span>
                              </a>
                              {files.length > 1 && (
                                <span className="text-[9px] text-white/30 font-bold uppercase ml-6">
                                  + {files.length - 1} more files
                                </span>
                              )}
                            </div>
                          );
                        }
                      } catch (e) {}
                      return (
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-neon-blue hover:text-white transition-colors text-[11px] font-bold uppercase tracking-tight"
                        >
                          <FileText size={14} className="flex-shrink-0" />
                          <span className="truncate max-w-[250px]">
                            Artifact
                          </span>
                        </a>
                      );
                    })()}
                  </TableCell>

                  {/* 4. STATUS BADGE (FIXED: Agar tidak terpotong vertikal) */}
                  <TableCell className="py-5">
                    {/* PERBAIKAN: whitespace-nowrap & min-w agar badge Pending melebar kesamping */}
                    <div className="flex items-center whitespace-nowrap min-w-[100px]">
                      <StatusBadge status={sub.status} />
                    </div>
                  </TableCell>

                  {/* 5. GRADE */}
                  <TableCell className="font-bold text-white text-sm py-5">
                    {sub.grade !== null ? `${sub.grade}%` : "-"}
                  </TableCell>

                  {/* 6. ACTION BUTTONS (FIXED) */}
                  <TableCell className="text-right pr-6 py-5">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        // PERBAIKAN: min-w ditambahkan agar tombol tidak gepeng
                        className="bg-white/5 border border-white/10 text-white hover:bg-neon-purple hover:border-neon-purple transition-all px-4 py-1.5 h-8 rounded-lg font-bold uppercase tracking-tight text-[10px] min-w-[80px]"
                        onClick={() => openGrading(sub)}
                      >
                        Assess
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all h-8 w-8"
                        onClick={() => handleDeleteSubmission(sub.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Grading Sheet */}
      <Sheet
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <SheetContent className="bg-dark-bg/95 border-l border-white/5 text-white sm:max-w-md backdrop-blur-2xl p-0 flex flex-col h-full">
          {/* HEADER SECTION */}
          <div className="bg-gradient-to-r from-neon-purple/10 to-neon-blue/10 p-8 border-b border-white/5 shrink-0">
            <SheetTitle className="text-2xl font-bold tracking-tight text-white mb-2">
              Assessment Hub
            </SheetTitle>
            <SheetDescription className="text-white/40 font-medium">
              Evaluating student work for{" "}
              <strong>{selectedSubmission?.student?.name}</strong>.
            </SheetDescription>
          </div>

          {/* SCROLLABLE CONTENT SECTION */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* 1. File List */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neon-blue ml-1">
                Submitted Artifacts
              </Label>
              <div className="space-y-2">
                {(() => {
                  let files = [];
                  try {
                    const parsed = JSON.parse(selectedSubmission?.fileUrl);
                    files = Array.isArray(parsed)
                      ? parsed
                      : [{ name: "Artifact", url: selectedSubmission.fileUrl }];
                  } catch (e) {
                    files = [
                      { name: "Artifact", url: selectedSubmission?.fileUrl },
                    ];
                  }

                  return files.map((file: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group/file hover:bg-white/5 transition-all gap-3"
                    >
                      {/* File Name (Bisa memendek/truncate) */}
                      <div className="flex items-center gap-2.5 text-white/70 overflow-hidden">
                        <FileText
                          size={16}
                          className="text-neon-blue flex-shrink-0"
                        />
                        <span className="text-[11px] font-bold tracking-tight truncate">
                          {file.path || file.name}
                        </span>
                      </div>

                      <a
                        href={file.url}
                        target="_blank"
                        className="text-[8px] font-bold uppercase tracking-widest bg-white/10 text-white px-5 py-1.5 rounded-lg hover:bg-white hover:text-black transition-all whitespace-nowrap shrink-0"
                      >
                        Open
                      </a>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* 2. Score Input */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neon-purple ml-1">
                Academic Evaluation (%)
              </Label>
              <Input
                type="number"
                value={grade}
                onChange={(e: any) => setGrade(e.target.value)}
                className="bg-white/5 border-white/10 text-white font-bold text-lg h-12 rounded-xl focus:border-neon-purple/50"
                placeholder="0-100"
              />
            </div>

            {/* 3. Feedback */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-neon-soft-blue ml-1">
                Professional Feedback
              </Label>
              <Textarea
                value={feedback}
                onChange={(e: any) => setFeedback(e.target.value)}
                className="bg-white/5 border-white/10 min-h-[120px] rounded-xl p-4 focus:border-neon-purple/50 font-medium text-sm leading-relaxed"
                placeholder="Provide constructive insight..."
              />
            </div>
          </div>

          <SheetFooter className="p-6 pt-0 w-full flex flex-col sm:flex-col gap-3 sm:space-x-0 shrink-0">
            {/* Row 2: Approve */}
            <div className="relative group w-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl blur opacity-30 group-hover:opacity-60 transition-all duration-700"></div>
              <Button
                onClick={() => handleSave("APPROVED")}
                disabled={gradingLoading}
                className="relative w-full h-12 bg-white text-black hover:bg-neon-purple hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-2xl flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} className="shrink-0" />
                <span className="whitespace-nowrap">
                  Approve & Issue Achievement
                </span>
              </Button>
            </div>

            {/* Row 3: Neon Text */}
            <div className="w-full flex justify-center mt-1">
              <p className="text-[9px] text-center font-bold uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] leading-relaxed w-full">
                Approval triggers blockchain verification and credential
                generation.
              </p>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    GRADED: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <span
      className={`px-3 py-1 rounded-md text-[9px] font-extrabold border uppercase tracking-widest whitespace-nowrap inline-flex items-center justify-center ${
        styles[status] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}
