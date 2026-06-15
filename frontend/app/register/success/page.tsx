"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-card p-10 rounded-3xl border border-teal-500/20 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-teal-500/10 rounded-full border border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
            <CheckCircle className="w-16 h-16 text-teal-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Registration Successful!
        </h2>

        <p className="text-slate-300 text-sm leading-relaxed mb-8">
          Your account has been created and is currently
          <span className="text-yellow-400 font-semibold">
            {" "}
            Pending Approval
          </span>
          .
          <br />
          <br />
          Please wait for an Administrator to verify your account. You will be
          notified once your access is granted.
        </p>

        <Link
          href="/login"
          className="block w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all border border-white/10"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
