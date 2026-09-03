"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Download,
  Calendar,
  Hash,
  FileCheck,
  Award,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Printer,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getApiBase } from "@/lib/utils";
import { getIpfsGatewayUrl } from "@/lib/ipfs";
import CertificateTemplate from "@/components/features/CertificateTemplate";
import QRCode from "qrcode";

interface CertificateDetail {
  id: string;
  certId: string;
  cid: string;
  status: string;
  issuedAt: string;
  hash: string;
  studentName: string;
  studentId?: string;
  program?: string;
  majority?: string;
  supersededBy?: string;
  supersededFrom?: string;
  course: {
    title: string;
    id: string;
  };
}

export default function CertificateDetailPage() {
  const { id } = useParams();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<string>("aspect-[1.414/1]");
  const [layoutSettings, setLayoutSettings] = useState<any>({});
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [requestedName, setRequestedName] = useState("");
  const [requestedProgram, setRequestedProgram] = useState("");
  const [requestedMajority, setRequestedMajority] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [hasSubmittedCorrection, setHasSubmittedCorrection] = useState(false);

  useEffect(() => {
    // Fetch certificate settings & layout from public LMS settings endpoint
    api
      .get("/lms/settings")
      .then((res) => {
        if (res.data?.ok && res.data?.settings) {
          setLayoutSettings(res.data.settings);
        } else if (res.data?.ok && res.data?.data) {
          setLayoutSettings(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch certificate layout settings:", err.message);
      });
  }, []);

  useEffect(() => {
    if (id) {
      api
        .get(`/certificates/${id}`)
        .then((res) => {
          if (res.data.ok) {
            setCert(res.data.record);
            setRequestedName(res.data.record?.studentName || "");
            setRequestedProgram(res.data.record?.program || "");
            setRequestedMajority(res.data.record?.majority || "");
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (cert?.certId) {
      const clientBase =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.willfaa.web.id";
      QRCode.toDataURL(`${clientBase}/verify/${cert.certId}`, {
        margin: 1,
        width: 256,
      })
        .then(setQrCodeBase64)
        .catch(() => {});
    }
  }, [cert]);

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cert || !correctionReason.trim()) {
      toast.error("Mohon isi alasan pengajuan koreksi data.");
      return;
    }

    setSubmittingCorrection(true);
    try {
      const res = await api.post("/certificates/request-correction", {
        certificateId: cert.id || cert.certId,
        requestedName: requestedName.trim(),
        requestedProgram: requestedProgram.trim(),
        requestedMajority: requestedMajority.trim(),
        reason: correctionReason.trim(),
      });

      if (res.data.ok) {
        toast.success("Pengajuan koreksi data berhasil dikirim ke Admin/Dosen!");
        setShowCorrectionModal(false);
        setHasSubmittedCorrection(true);
      }
    } catch (err: any) {
      console.error("Failed to submit correction:", err);
      toast.error(err.response?.data?.error || "Gagal mengirim pengajuan koreksi");
    } finally {
      setSubmittingCorrection(false);
    }
  };

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

  const ipfsGateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "http://localhost:8080";
  const ipfsUrl = `${ipfsGateway}/ipfs/${cert.cid}`;

  const API_BASE = getApiBase();
  const pdfUrl = `${API_BASE}/api/certificates/${cert.certId}/pdf`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            href="/student/certificates"
            className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali ke Daftar Sertifikat
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCorrectionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Edit3 size={14} />
              Ajukan Koreksi Data
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
            >
              <Printer size={14} />
              Cetak / Simpan PDF
            </button>

            {cert.cid && (
              <a
                href={getIpfsGatewayUrl(cert.cid)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors border border-slate-700 text-slate-300"
              >
                <ExternalLink size={14} />
                Artifak IPFS
              </a>
            )}

            <Link
              href={`/verify/${cert.certId}`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20"
            >
              <ShieldCheck size={14} />
              Verifikasi
            </Link>
          </div>
        </div>

        {hasSubmittedCorrection && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-300 text-xs">
            <AlertCircle size={18} className="shrink-0" />
            <span>
              Pengajuan koreksi data Anda telah terkirim. Admin/Dosen akan meninjau dan menerbitkan ulang sertifikat pengganti jika disetujui.
            </span>
          </div>
        )}

        {cert.status === "SUPERSEDED" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4 text-amber-300 text-xs">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <span>
                Sertifikat ini telah diperbarui secara resmi ke versi terbaru.
              </span>
            </div>
            {cert.supersededBy && (
              <Link
                href={`/student/certificates/${cert.supersededBy}`}
                className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg uppercase tracking-wider shrink-0"
              >
                Buka Sertifikat Baru &rarr;
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full bg-slate-950/80 rounded-2xl border border-white/10 p-4 sm:p-6 overflow-auto custom-scrollbar flex items-center justify-center relative shadow-2xl">
              <div className="flex items-center justify-center shrink-0 m-auto">
                <CertificateTemplate
                  studentName={cert.studentName}
                  studentId={cert.studentId || (cert as any).studentId}
                  courseName={cert.course?.title || cert.program || "Sertifikat Kelulusan"}
                  certificateId={cert.certId || cert.id}
                  program={cert.program}
                  majority={cert.majority}
                  issuedAt={cert.issuedAt}
                  qrCodeBase64={qrCodeBase64}
                  layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                  paperSize={layoutSettings.certificatePaperSize || "A4"}
                  paperWidthCm={layoutSettings.paperWidthCm || 29.7}
                  paperHeightCm={layoutSettings.paperHeightCm || 21.0}
                  instructorName={layoutSettings.instructorName}
                  instructorNip={layoutSettings.instructorNip}
                  bgPath={layoutSettings.certificateTemplate || layoutSettings.bgPath}
                  layoutConfig={layoutSettings.layoutConfig}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-6">
            <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  {cert.course?.title || "Sertifikat Kelulusan"}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                    cert.status === "ISSUED"
                      ? "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      : cert.status === "SUPERSEDED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
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
                      Nama Mahasiswa
                    </p>
                    <p className="text-sm font-bold text-white">
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
                Digital Fingerprint (SHA-256)
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

      {/* MODAL PENGAJUAN KOREKSI DATA */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#111116] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ajukan Koreksi Data Sertifikat
                  </h3>
                  <p className="text-xs text-slate-400">
                    Koreksi ejaan nama, program studi, atau keahlian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ejaan Nama Lengkap yang Benar
                </label>
                <input
                  type="text"
                  required
                  value={requestedName}
                  onChange={(e) => setRequestedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="Contoh: Budi Santoso, S.Kom."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Konsentrasi / Jurusan
                  </label>
                  <input
                    type="text"
                    value={requestedProgram}
                    onChange={(e) => setRequestedProgram(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="Teknik Informatika"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Bidang Keahlian
                  </label>
                  <input
                    type="text"
                    value={requestedMajority}
                    onChange={(e) => setRequestedMajority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="Software Engineering"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Alasan Koreksi <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Contoh: Typo pada penulisan nama di sertifikat (tertera 'Budi Santso' seharusnya 'Budi Santoso')."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {submittingCorrection ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Kirim Pengajuan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
