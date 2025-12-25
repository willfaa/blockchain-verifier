import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50 font-sans flex flex-col">
      {/* Navbar Logic Match */}
      <Navbar />

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Decorative Blobs (Same as Landing) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-[100px]" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        {/* 404 Big Text Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-20">
          <h1 className="text-[15rem] md:text-[25rem] font-black text-slate-900 leading-none tracking-tighter mix-blend-overlay">
            404
          </h1>
        </div>

        {/* Content Card (Matches Landing 'Features' or 'Courses' card style but bigger) */}
        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 ring-1 ring-red-500/30 mb-4 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            System Failure
          </div>

          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">
            Page Not{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-orange-500">
              Found
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-lg mx-auto">
            The block you are looking for has not been mined or does not exist
            in the Chainnesa ecosystem. Please recalibrate your navigation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* Primary Button (Matches Landing 'Get Started') */}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-1 hover:shadow-cyan-500/40 min-w-[200px]"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Link>

            {/* Secondary Button (Matches Landing 'Go to Verification') */}
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10 hover:border-white/40 hover:-translate-y-1 min-w-[200px]"
            >
              Browse Courses
            </Link>
          </div>
        </div>

        {/* Technical Footer Decoration */}
        <div className="absolute bottom-6 w-full text-center">
          <code className="text-[10px] md:text-xs text-slate-600 font-mono">
            ERROR_CODE: 404_NOT_FOUND // BLOCK_HEIGHT: 0 // HASH: NULL
          </code>
        </div>
      </main>
    </div>
  );
}
