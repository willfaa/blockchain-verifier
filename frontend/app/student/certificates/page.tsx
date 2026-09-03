"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Award,
  ExternalLink,
  Calendar,
  Loader2,
  Search,
  ShieldCheck,
  Download,
  Share2,
  Cpu,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from "sonner";

interface Certificate {
  id: string;
  certId: string;
  cid: string;
  status: string;
  issuedAt: string;
  hash: string;
  course: {
    title: string;
    imageUrl: string | null;
  };
}

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "http://localhost:8080";

export default function MyCertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async (query = "") => {
    try {
      setLoading(true);
      const res = await api.get(`/certificates/my-certificates`, {
        params: { search: query || undefined },
      });

      if (res.data.ok) {
        setCerts(res.data.data);
      }
    } catch (err: any) {
      console.error("[Certs] Fetch Error:", err);
      if (err.response?.status !== 401) {
        toast.error("Network instability detected. Re-syncing protocol...");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates(search);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "TBD";
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "TBD";
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash.includes("Not_Available")) return "PENDING_BLOCK_SYNC";
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-50 overflow-x-hidden selection:bg-neon-purple/30 font-sans">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-8 pt-40 pb-24">
        {/* Galaxy Header */}
        <div className="text-center mb-24 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-neon-purple/5 blur-[120px] pointer-events-none" />
          <p className="text-[10px] font-bold text-neon-blue uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-bottom-4">
            Academic Verification Hub
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 tracking-tight">
            Student <span className="galaxy-gradient-text">Achievements</span>
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 text-sm md:text-base leading-relaxed">
            Your earned credentials, secured by blockchain technology.
            Verifiable, permanent, and recognized globally as institutional
            proof of excellence.
          </p>
        </div>

        {/* Search Bar - Galaxy Style */}
        <div className="max-w-2xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
            <input
              type="text"
              placeholder="Search certificates by course title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-8 text-sm md:text-md focus:outline-none focus:border-neon-purple/30 focus:bg-white/[0.08] transition-all relative z-10"
            />
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-neon-purple z-10 transition-colors"
              size={22}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue text-white font-bold rounded-full text-xs uppercase z-10 hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8 relative">
            <div className="h-16 w-16 border-4 border-white/5 border-t-neon-purple rounded-full animate-spin shadow-[0_0_20px_rgba(176,38,255,0.2)]" />
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
              Retrieving Secured Data
            </p>
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-[3rem] border-white/5 max-w-2xl mx-auto text-center animate-in zoom-in duration-700">
            <div className="bg-white/[0.02] p-8 rounded-full mb-8 border border-white/5 shadow-inner">
              <Award className="h-20 w-20 text-white/5" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              No Records Found
            </h3>
            <p className="text-white/30 mt-6 text-sm max-w-sm px-8 leading-relaxed font-medium">
              Your academic vault is currently empty. Complete your enrolled
              courses to earn blockchain-secured credentials.
            </p>
            <Link
              href="/courses"
              className="mt-12 px-12 py-5 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-3xl hover:bg-neon-blue hover:text-white transition-all transform hover:scale-105 shadow-xl"
            >
              Browse Curriculum
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 animate-in fade-in duration-1000">
            {certs.map((cert, idx) => (
              <div
                key={cert.id}
                className="group relative h-[440px] bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden hover:border-neon-purple/40 transition-all duration-500 hover:shadow-3xl flex flex-col animate-in slide-in-from-bottom-12"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                {/* Certificate Visual Banner */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 p-6 flex flex-col justify-between border-b border-white/5 group-hover:border-neon-purple/30 transition-all">
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-neon-purple/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Verified / Pending Badge */}
                  <div className="flex items-center justify-between z-10">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 backdrop-blur-xl border rounded-full ${
                        cert.status === "PENDING"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : cert.status === "SUPERSEDED"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-neon-purple/10 border-neon-purple/20 text-white"
                      }`}
                    >
                      {cert.status === "PENDING" ? (
                        <Clock size={12} className="text-amber-400 animate-pulse" />
                      ) : (
                        <ShieldCheck size={12} className="text-neon-purple" />
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {cert.status === "PENDING"
                          ? "PENDING SYNC"
                          : cert.status === "SUPERSEDED"
                          ? "SUPERSEDED"
                          : "VERIFIED"}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                      #{cert.certId ? cert.certId.substring(0, 8).toUpperCase() : "CERT"}
                    </span>
                  </div>

                  <div className="z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1">
                      Certificate of Achievement
                    </p>
                    <h3 className="font-bold text-white text-base line-clamp-2 leading-tight drop-shadow-2xl group-hover:text-neon-blue transition-colors tracking-tight">
                      {cert.course?.title || (cert as any).program || "Sertifikat Kompetensi"}
                    </h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex-1 flex flex-col justify-between">
                  {/* Meta Group */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        <Calendar size={14} className="text-neon-purple" />
                        {formatDate(cert.issuedAt)}
                      </div>
                      <div className="w-10 h-px bg-white/5 flex-1 mx-4" />
                      <div className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">
                        EST CONFIRMED
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest">
                        Blockchain Certificate Hash
                      </p>
                      <div className="group/hash flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all cursor-help">
                        <p className="font-mono text-[10px] text-white/40">
                          {truncateHash(cert.hash)}
                        </p>
                        <ExternalLink
                          size={12}
                          className="text-white/20 group-hover/hash:text-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                    <Link
                      href={`/student/certificates/${cert.id}`}
                      className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-widest"
                    >
                      <ExternalLink size={14} /> View Details
                    </Link>
                    <Link
                      href={`/student/certificates/${cert.id}`}
                      className="w-14 flex items-center justify-center bg-neon-purple text-white rounded-2xl hover:bg-neon-blue transition-all shadow-xl"
                      title="Lihat Sertifikat Lengkap"
                    >
                      <Download size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-neon-purple/5 blur-[180px] -z-10 animate-pulse" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-neon-blue/5 blur-[150px] -z-10" />
    </div>
  );
}
