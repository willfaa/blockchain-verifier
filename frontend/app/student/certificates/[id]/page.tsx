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
  Clock,
  ZoomIn,
  ZoomOut,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getApiBase } from "@/lib/utils";
import { getIpfsGatewayUrl } from "@/lib/ipfs";
import CertificateTemplate from "@/components/features/CertificateTemplate";
import CertificateTranscriptPage from "@/components/features/CertificateTranscriptPage";
import QRCode from "qrcode";

interface CertificateDetail {
  id: string;
  certId: string;
  studentName: string;
  studentId?: string;
  program: string;
  majority: string;
  issuedAt: string;
  cid: string;
  hash: string;
  status: string;
  supersededBy?: string;
  course?: {
    title: string;
    certificateTemplate?: string | null;
  };
  competencyUnits?: any[];
  signers?: any[];
  schoolName?: string;
  layoutMode?: string;
  frontUrl?: string;
  transcriptUrl?: string;
  blockchainTxId?: string;
  blockchainSyncStatus?: string;
}

export default function StudentCertificateDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"front" | "transcript">("front");
  const [layoutSettings, setLayoutSettings] = useState<any>({});
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");

  // Zoom states
  const [frontZoom, setFrontZoom] = useState<number>(75);
  const [transcriptZoom, setTranscriptZoom] = useState<number>(75);

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [requestedName, setRequestedName] = useState("");
  const [requestedProgram, setRequestedProgram] = useState("");
  const [requestedMajority, setRequestedMajority] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [hasSubmittedCorrection, setHasSubmittedCorrection] = useState(false);

  const IPFS_GATEWAY =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
    "https://green-real-rhinoceros-350.mypinata.cloud";

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

  // Compute IPFS image URLs
  const cleanCid = cert?.cid ? cert.cid.trim() : "";
  const isCidHttp =
    cleanCid.startsWith("http://") || cleanCid.startsWith("https://");
  const normalizedGateway = IPFS_GATEWAY.replace(/\/ipfs\/?$/, "").replace(
    /\/$/,
    ""
  );

  const ipfsFrontUrl =
    isCidHttp
      ? cleanCid
      : cleanCid &&
        !cleanCid.startsWith("PENDING") &&
        !cleanCid.startsWith("undefined") &&
        !cleanCid.startsWith("Qm000")
      ? `${normalizedGateway}/ipfs/${cleanCid.replace(/^ipfs:\/\//, "")}`
      : "";

  const effectiveFrontImage = ipfsFrontUrl || cert?.frontUrl || "";
  const effectiveTranscriptImage = cert?.transcriptUrl || "";

  const isPreIssued =
    cert?.layoutMode === "PRE_ISSUED_STAMP" ||
    cert?.layoutMode === "DUPLEX_2_PAGES" ||
    Boolean(effectiveFrontImage);

  const hasSecondPage =
    cert?.layoutMode === "DUPLEX_2_PAGES" ||
    Boolean(effectiveTranscriptImage) ||
    (!isPreIssued &&
      Boolean(cert?.competencyUnits && cert.competencyUnits.length > 0));

  // Template canvas sizing
  const isLandscape =
    (layoutSettings.certificateLayout || "HORIZONTAL") !== "VERTICAL";
  const defaultW = isLandscape ? 29.7 : 21.0;
  const defaultH = isLandscape ? 21.0 : 29.7;
  const paperWCm = layoutSettings.paperWidthCm || defaultW;
  const paperHCm = layoutSettings.paperHeightCm || defaultH;
  const templateCanvasW = Math.round(paperWCm * (150 / 2.54));
  const templateCanvasH = Math.round(paperHCm * (150 / 2.54));

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

  const API_BASE = getApiBase();

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
              disabled={cert.status === "PENDING"}
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
            >
              <Printer size={14} />
              Cetak / Simpan PDF
            </button>

            {effectiveFrontImage && (
              <a
                href={effectiveFrontImage}
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

        {cert.status === "PENDING" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-300 text-xs">
            <Clock size={18} className="shrink-0 animate-pulse" />
            <span>
              <strong>Status Antrean Konsensus:</strong> Sertifikat ini baru saja diajukan dan sedang menunggu pencatatan resmi ke Hyperledger Fabric Ledger (channel: chainnesa) serta pinning ke IPFS. Tampilan visual sertifikat resmi dan cetak PDF akan aktif setelah proses sinkronisasi selesai.
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
          <div className="lg:col-span-2 space-y-4">
            {/* Dual Tab Switcher */}
            {cert.status !== "PENDING" && hasSecondPage && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/10 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("front")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "front"
                      ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Award size={15} />
                  <span>{isPreIssued ? "Sertifikat Bertanda (Halaman 1)" : "Halaman 1 (Sertifikat Utama)"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("transcript")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "transcript"
                      ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileText size={15} />
                  <span>{effectiveTranscriptImage ? "Transkrip / Hal 2" : "Halaman 2 (Transkrip Nilai)"}</span>
                </button>
              </div>
            )}

            {/* Certificate Viewer with Zoom */}
            <div className="w-full bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl min-h-[350px]">
              {cert.status === "PENDING" ? (
                <div className="p-8 text-center space-y-4 max-w-md m-auto flex-1 flex flex-col items-center justify-center">
                  <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock size={32} className="animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Sertifikat Sedang Dalam Antrean Konsensus Blockchain
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sertifikat Anda telah tersimpan di antrean sistem dan menunggu validasi on-chain oleh node validator. Desain sertifikat resmi akan ditampilkan begitu proses sinkronisasi berhasil.
                  </p>
                </div>
              ) : (
                <>
                  {/* Zoom Toolbar */}
                  <div className="w-full flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={16} />
                      {activeTab === "front" ? "Dokumen Sertifikat Terverifikasi" : "Transkrip Nilai (Halaman 2)"}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          activeTab === "front"
                            ? setFrontZoom((z) => Math.max(30, z - 10))
                            : setTranscriptZoom((z) => Math.max(30, z - 10))
                        }
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Perkecil (Zoom Out)"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="text-xs font-mono text-white/90 w-12 text-center select-none font-semibold">
                        {activeTab === "front" ? frontZoom : transcriptZoom}%
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          activeTab === "front"
                            ? setFrontZoom((z) => Math.min(180, z + 10))
                            : setTranscriptZoom((z) => Math.min(180, z + 10))
                        }
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Perbesar (Zoom In)"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          activeTab === "front"
                            ? setFrontZoom(isPreIssued ? 75 : 55)
                            : setTranscriptZoom(effectiveTranscriptImage ? 75 : 55)
                        }
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-all ml-1"
                        title="Fit Layar"
                      >
                        Fit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          activeTab === "front"
                            ? setFrontZoom(100)
                            : setTranscriptZoom(100)
                        }
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors"
                        title="Ukuran Asli 100%"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Content: Front or Transcript */}
                  <div
                    onWheel={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const setter =
                          activeTab === "front" ? setFrontZoom : setTranscriptZoom;
                        if (e.deltaY < 0) {
                          setter((z) => Math.min(180, z + 5));
                        } else {
                          setter((z) => Math.max(30, z - 5));
                        }
                      }
                    }}
                    className="w-full overflow-auto max-h-[75vh] flex items-center justify-center p-2 sm:p-4 custom-scrollbar"
                  >
                    {activeTab === "front" ? (
                      /* FRONT PAGE */
                      isPreIssued && effectiveFrontImage ? (
                        <img
                          src={effectiveFrontImage}
                          alt={`Sertifikat ${cert.studentName}`}
                          style={{
                            width: `${frontZoom}%`,
                            maxWidth: frontZoom <= 100 ? "100%" : "none",
                            maxHeight: frontZoom <= 100 ? "65vh" : "none",
                            objectFit: "contain",
                            transition: "width 0.15s ease-out",
                          }}
                          className="rounded-xl shadow-2xl border border-white/10 select-none m-auto"
                        />
                      ) : (
                        <div
                          style={{
                            width: `${Math.round(templateCanvasW * (frontZoom / 100))}px`,
                            height: `${Math.round(templateCanvasH * (frontZoom / 100))}px`,
                            minWidth: `${Math.round(templateCanvasW * (frontZoom / 100))}px`,
                            minHeight: `${Math.round(templateCanvasH * (frontZoom / 100))}px`,
                            transition: "width 0.15s ease-out, height 0.15s ease-out",
                          }}
                          className="relative shrink-0 shadow-2xl rounded-xl overflow-hidden border border-white/10 m-auto"
                        >
                          <div
                            style={{
                              width: `${templateCanvasW}px`,
                              height: `${templateCanvasH}px`,
                              transform: `scale(${frontZoom / 100})`,
                              transformOrigin: "top left",
                              transition: "transform 0.15s ease-out",
                            }}
                            className="absolute top-0 left-0 select-none pointer-events-auto"
                          >
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
                              paperWidthCm={layoutSettings.paperWidthCm || defaultW}
                              paperHeightCm={layoutSettings.paperHeightCm || defaultH}
                              instructorName={layoutSettings.instructorName}
                              instructorNip={layoutSettings.instructorNip}
                              instructors={layoutSettings.instructors}
                              institutionLogo={layoutSettings.institutionLogo}
                              institutionName={layoutSettings.institutionName}
                              institutionSubtext={layoutSettings.institutionSubtext}
                              bgPath={layoutSettings.certificateTemplate || layoutSettings.bgPath}
                              layoutConfig={layoutSettings.layoutConfig}
                            />
                          </div>
                        </div>
                      )
                    ) : (
                      /* TRANSCRIPT PAGE */
                      effectiveTranscriptImage ? (
                        <img
                          src={effectiveTranscriptImage}
                          alt={`Transkrip ${cert.studentName}`}
                          style={{
                            width: `${transcriptZoom}%`,
                            maxWidth: transcriptZoom <= 100 ? "100%" : "none",
                            maxHeight: transcriptZoom <= 100 ? "65vh" : "none",
                            objectFit: "contain",
                            transition: "width 0.15s ease-out",
                          }}
                          className="rounded-xl shadow-2xl border border-white/10 select-none m-auto"
                        />
                      ) : (
                        <div
                          style={{
                            width: `${Math.round(templateCanvasW * (transcriptZoom / 100))}px`,
                            height: `${Math.round(templateCanvasH * (transcriptZoom / 100))}px`,
                            minWidth: `${Math.round(templateCanvasW * (transcriptZoom / 100))}px`,
                            minHeight: `${Math.round(templateCanvasH * (transcriptZoom / 100))}px`,
                            transition: "width 0.15s ease-out, height 0.15s ease-out",
                          }}
                          className="relative shrink-0 shadow-2xl rounded-xl overflow-hidden border border-white/10 m-auto"
                        >
                          <div
                            style={{
                              width: `${templateCanvasW}px`,
                              height: `${templateCanvasH}px`,
                              transform: `scale(${transcriptZoom / 100})`,
                              transformOrigin: "top left",
                              transition: "transform 0.15s ease-out",
                            }}
                            className="absolute top-0 left-0 select-none pointer-events-auto"
                          >
                            <CertificateTranscriptPage
                              studentName={cert.studentName}
                              studentId={cert.studentId || (cert as any).studentId}
                              majority={cert.majority || "Teknik Komputer dan Jaringan"}
                              program={cert.program || cert.course?.title}
                              courseTitle={cert.course?.title}
                              units={cert.competencyUnits}
                              examinerName={layoutSettings.instructorName || "Penguji / Asesor"}
                              examinerNip={layoutSettings.instructorNip}
                              institutionLogo={layoutSettings.institutionLogo}
                              institutionName={layoutSettings.institutionName}
                              institutionSubtext={layoutSettings.institutionSubtext}
                              schoolName={layoutSettings.institutionName || cert.schoolName || layoutSettings.schoolName || "SMK Mitra IDUKA"}
                              paperSize={layoutSettings.certificatePaperSize || "A4"}
                              paperWidthCm={layoutSettings.paperWidthCm || defaultW}
                              paperHeightCm={layoutSettings.paperHeightCm || defaultH}
                              layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                              bgPath={layoutSettings.transcriptTemplate || layoutSettings.transcriptBgPath}
                              layoutConfig={layoutSettings.transcriptLayoutConfig}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* IPFS CID Badge */}
                  {cleanCid && (
                    <div className="px-4 py-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/50 font-mono">
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        IPFS Artifact: {cleanCid.substring(0, 32)}...
                      </span>
                      <a
                        href={
                          isCidHttp
                            ? cleanCid
                            : `${normalizedGateway}/ipfs/${cleanCid.replace(/^ipfs:\/\//, "")}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-sans font-bold text-xs"
                      >
                        Buka Artifak IPFS Asli <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </>
              )}
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
                      : cert.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}
                >
                  {cert.status === "PENDING" ? (
                    <Clock size={12} className="animate-pulse" />
                  ) : (
                    <FileCheck size={12} />
                  )}
                  {cert.status === "PENDING" ? "PENDING SYNC" : cert.status}
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
                      {(() => {
                        try {
                          const d = new Date(cert.issuedAt);
                          if (isNaN(d.getTime())) return cert.issuedAt;
                          return d.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });
                        } catch {
                          return cert.issuedAt;
                        }
                      })()}
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

                {cert.blockchainTxId && (
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="text-slate-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                        Transaction ID
                      </p>
                      <p className="text-xs font-mono text-cyan-400/80 break-all">
                        {cert.blockchainTxId}
                      </p>
                    </div>
                  </div>
                )}
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
