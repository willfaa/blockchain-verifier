import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-bg text-slate-50 font-sans flex flex-col">
      {/* Navbar Logic Match */}
      <Navbar />

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-neon-purple/10 blur-[130px]" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-neon-blue/10 blur-[130px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-neon-purple/5 blur-[150px]" />
        </div>

        {/* 404 Big Text Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-10">
          <h1 className="text-[15rem] md:text-[25rem] font-bold text-white tracking-tighter mix-blend-overlay">
            404
          </h1>
        </div>

        {/* Content Card */}
        <div className="relative z-10 max-w-2xl w-full text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center justify-center gap-3 rounded-full bg-white/5 px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neon-blue border border-white/10 mb-4 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            Navigation Error
          </div>

          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            Page Not <span className="galaxy-gradient-text">Found</span>
          </h2>

          <p className="text-lg md:text-xl text-white/40 leading-relaxed max-w-lg mx-auto font-medium">
            The curriculum module or resource you are looking for does not exist
            on this platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <Link
              href="/"
              className="group relative flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest hover:bg-neon-purple hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl min-w-[220px]"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Link>

            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-10 py-5 text-xs font-bold text-white uppercase tracking-widest transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 active:scale-95 min-w-[220px]"
            >
              Browse Curriculum
            </Link>
          </div>
        </div>

        {/* Footer Decoration */}
        <div className="absolute bottom-10 w-full text-center">
          <code className="text-[10px] text-white/10 font-bold tracking-[0.4em] uppercase">
            Platform Protocol // 404
          </code>
        </div>
      </main>
    </div>
  );
}
