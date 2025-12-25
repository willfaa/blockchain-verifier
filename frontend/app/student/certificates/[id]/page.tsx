"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Download,
  ExternalLink,
  Calendar,
  Hash,
  FileCheck,
  Award,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface CertificateDetail {
  id: string;
  certId: string;
  cid: string;
  status: string;
  issuedAt: string;
  hash: string;
  studentName: string;
  course: {
    title: string;
    id: string;
  };
}

export default function CertificateDetailPage() {
  const { id } = useParams();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api
        .get(`/certificates/${id}`)
        .then((res) => {
          if (res.data.ok) setCert(res.data.record);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <Loader2 className="animate-spin text-teal-400" size={32} />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
        <h1 className="text-2xl font-bold mb-4">Certificate Not Found</h1>
        <Link
          href="/student/certificates"
          className="text-teal-400 hover:underline"
        >
          Back to My Certificates
        </Link>
      </div>
    );
  }

  const ipfsUrl = `http://localhost:8080/ipfs/${cert.cid}`; // Or gateway

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/student/certificates"
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Certificates
          </Link>

          <div className="flex gap-3">
            <a
              href={ipfsUrl}
              download={`certificate-${cert.certId}.png`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              <Download size={16} />
              Download
            </a>
            <Link
              href={`/verify/${cert.certId}`}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-teal-900/20"
            >
              <ShieldCheck size={16} />
              Verify on Blockchain
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[1.414/1] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <Image
                src={ipfsUrl}
                alt="Certificate Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-6">
            <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  {cert.course.title}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20 uppercase tracking-wider">
                  <FileCheck size={12} />
                  {cert.status}
                </span>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800/50">
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-500 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Issued Date
                    </p>
                    <p className="text-sm font-medium text-slate-300">
                      {new Date(cert.issuedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="text-slate-500 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Recipient
                    </p>
                    <p className="text-sm font-medium text-slate-300">
                      {cert.studentName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="text-slate-500 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Certificate ID
                    </p>
                    <p className="text-xs font-mono text-slate-400 break-all">
                      {cert.certId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">
                Digital Fingerprint (Hash)
              </p>
              <div className="bg-black/50 p-2 rounded-lg border border-slate-800/50">
                <code className="text-[10px] text-teal-500/70 break-all font-mono">
                  {cert.hash}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
