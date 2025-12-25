"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Award, Lock, ExternalLink, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";

interface Certificate {
  id: string;
  certId: string;
  cid: string;
  status: string;
  issuedAt: string;
  course: {
    title: string;
    thumbnail: string | null;
  };
}

export default function MyCertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/certificates/my-certificates")
      .then((res) => {
        if (res.data.ok) setCerts(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-teal-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0724] text-slate-50">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3 animate-in fade-in slide-in-from-bottom-4">
            Validation
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-teal-400 via-emerald-500 to-cyan-500 animate-in fade-in slide-in-from-bottom-6 duration-700">
            My Blockchain Certificates
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Verify and download your blockchain-secured credentials. Immutable
            proof of your academic achievements.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-teal-400">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p className="text-slate-500 text-sm tracking-wider">
              Loading Credentials...
            </p>
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 max-w-lg mx-auto">
            <div className="bg-slate-900/50 p-4 rounded-full mb-4">
              <Award className="h-12 w-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white">
              No Certificates Yet
            </h3>
            <p className="text-slate-400 mt-2 text-sm text-center px-6">
              Complete courses and pass exams to earn verified blockchain
              certificates.
            </p>
            <Link
              href="/courses"
              className="inline-block mt-6 px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-medium transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {certs.map((cert, idx) => (
              <Link
                key={cert.id}
                href={`/student/certificates/${cert.id}`}
                className="group relative bg-[#0a0a0f] border border-slate-800 rounded-xl overflow-hidden hover:border-teal-500/50 transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] h-full flex flex-col"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="aspect-video relative bg-slate-900">
                  {/* Certificate Preview / Thumbnail */}
                  <Image
                    src={`http://localhost:8080/ipfs/${cert.cid}`}
                    alt="Certificate"
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-white text-lg line-clamp-2 leading-tight drop-shadow-md">
                      {cert.course.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(cert.issuedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] uppercase font-bold tracking-wider">
                      {cert.status}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-800/50">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Certificate ID
                    </p>
                    <p
                      className="font-mono text-xs text-slate-300 truncate"
                      title={cert.certId}
                    >
                      {cert.certId}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
