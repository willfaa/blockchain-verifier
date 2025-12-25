"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";

export default function FocusGuard({ disabled }: { disabled?: boolean }) {
  const [isBlurred, setIsBlurred] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => {
    if (disabled) return; // Skip if disabled

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        setViolationCount((prev) => prev + 1);
      }
    };

    const handleWindowBlur = () => {
      setIsBlurred(true);
      // Optional: only increment if focused out for > X seconds to avoid accidental rapid triggers
      // For strict mode, instant is safer
      setViolationCount((prev) => prev + 1);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [disabled]);

  const handleResume = () => {
    setIsBlurred(false);
  };

  if (!isBlurred) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-md w-full bg-[#0f0b1e] border border-red-500/50 rounded-2xl p-8 shadow-2xl shadow-red-900/40 text-center animate-in scale-95 zoom-in-0 duration-200">
        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Exam Locked</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Leaving the exam window is{" "}
          <span className="text-red-400 font-bold">strictly prohibited</span>.
          Your time is still running.
        </p>

        <div className="bg-red-950/30 border border-red-900/30 rounded-lg p-3 mb-8">
          <p className="text-xs text-red-300 font-mono uppercase tracking-wider">
            Violation Count: {violationCount}
          </p>
        </div>

        <button
          onClick={handleResume}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/20 active:scale-95"
        >
          Resume Exam
        </button>
      </div>
    </div>
  );
}
