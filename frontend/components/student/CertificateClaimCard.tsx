//frontend/components/student/CertificateClaimCard.tsx
import React, { useState } from "react";
import { Award, Lock, Download, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import confetti from "canvas-confetti";

interface CertificateClaimCardProps {
  courseId: string;
  courseName: string;
  score: number;
  status: "PASSED" | "FAILED" | "NOT_STARTED";
  certificateUrl?: string | null;
  onClaimSuccess: () => void;
}

export default function CertificateClaimCard({
  courseId,
  courseName,
  score,
  status,
  certificateUrl,
  onClaimSuccess,
}: CertificateClaimCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    try {
      setLoading(true);
      const res = await api.post("/certificates/claim", { courseId });

      if (res.data.ok) {
        toast.success("Certificate claimed successfully!");
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22d3ee", "#34d399", "#f472b6"],
        });
        onClaimSuccess();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to claim certificate");
    } finally {
      setLoading(false);
    }
  };

  // 1. CASE A: Certificate Earned (Already Issued)
  if (certificateUrl) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-900/40 to-emerald-900/10 border-emerald-500/30 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20 pointer-events-none" />
        {/* Adjusted background icon to not be cut off and less intrusive */}
        <div className="absolute -top-2 -right-2 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Award size={80} className="text-emerald-400 rotate-12" />
        </div>

        {/* Changed to flex-col to be safe in sidebars */}
        <div className="relative z-10 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-bold animate-fadeIn">
                <CheckCircle size={10} /> Certified
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Certificate Earned
            </h3>
            <p className="text-slate-300 text-xs mt-1 line-clamp-3">
              Congratulations! You have officially verified your skills in{" "}
              <b className="text-emerald-300">{courseName}</b> on the
              blockchain.
            </p>
          </div>

          <Button
            onClick={() => window.open(certificateUrl, "_blank")}
            size="sm"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 group/btn"
          >
            <Download className="mr-2 h-3.5 w-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
            View Certificate
          </Button>
        </div>
      </Card>
    );
  }

  // 2. CASE B: Eligible to Claim (Passed, but no URL yet)
  if (status === "PASSED" && !certificateUrl) {
    return (
      <Card className="p-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-xl relative overflow-hidden shadow-xl shadow-orange-500/10">
        <div className="bg-[#0b0c24] rounded-lg p-4 h-full relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {/* Smaller Icon Container */}
              <div className="flex items-center justify-center h-12 w-12 bg-gradient-to-br from-amber-500/20 to-orange-500/5 rounded-full border border-orange-500/20 shrink-0">
                <Award className="text-amber-400 animate-pulse" size={24} />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent leading-tight">
                  Certificate Unlocked!
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Score:{" "}
                  <span className="text-amber-400 font-bold">
                    {score.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>

            <Button
              onClick={handleClaim}
              disabled={loading}
              size="sm"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-0 shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-3.5 w-3.5" />
                  Claim Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Shine Animation */}
        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite] pointer-events-none z-20"></div>
      </Card>
    );
  }

  // 3. CASE C: Not Eligible (Failed or Not Started)
  return (
    <Card className="p-4 bg-[#0b0c24] border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-800/50 flex items-center justify-center shrink-0 border border-white/5">
            <Lock className="text-slate-500" size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-300 leading-tight">
              Certificate Locked
            </h3>
            <p className="text-slate-500 text-xs mt-1 line-clamp-2">
              Pass the exam to unlock.
            </p>
          </div>
        </div>

        <Button
          disabled
          variant="outline"
          size="sm"
          className="w-full border-white/10 text-slate-500 h-8 text-xs"
        >
          Locked
        </Button>
      </div>
    </Card>
  );
}
