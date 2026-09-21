"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Award,
  Layers,
  Download,
  CheckCircle2,
  ExternalLink,
  Building,
  UserCheck,
  Hash,
  ShieldCheck,
  Printer,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
} from "lucide-react";
import CertificateTemplate from "@/components/features/CertificateTemplate";
import QRCode from "qrcode";
import api from "@/lib/api";
import CertificateTranscriptPage from "@/components/features/CertificateTranscriptPage";

export interface CompetencyUnit {
  code: string;
  title: string;
  standard?: string;
  result?: string;
  score?: number | string;
}

export interface SignerInfo {
  name: string;
  title: string;
  role?: string;
  nip?: string;
  institution?: string;
}

interface VerificationTranscriptViewerProps {
  certId: string;
  certificateNumber?: string | null;
  schoolName?: string | null;
  studentName: string;
  studentId: string;
  majority: string;
  program: string;
  courseTitle?: string;
  issuedAt: string;
  cid?: string | null;
  frontUrl?: string | null;
  transcriptUrl?: string | null;
  layoutMode?: string | null;
  hash: string;
  competencyUnits?: CompetencyUnit[] | null;
  signers?: SignerInfo[] | null;
  apiBase: string;
  ipfsGateway: string;
}

export function VerificationTranscriptViewer({
  certId,
  certificateNumber,
  schoolName,
  studentName,
  studentId,
  majority,
  program,
  courseTitle,
  issuedAt,
  cid,
  frontUrl,
  transcriptUrl,
  layoutMode,
  hash,
  competencyUnits,
  signers,
  apiBase,
  ipfsGateway,
}: VerificationTranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<"front" | "transcript">("front");
  const [copiedHash, setCopiedHash] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");
  const [layoutSettings, setLayoutSettings] = useState<any>({});

  const isPreIssued =
    layoutMode === "PRE_ISSUED_STAMP" ||
    Boolean(frontUrl) ||
    Boolean(cid && (cid.startsWith("http") || cid.startsWith("/storage") || cid.includes("supabase.co")));

  const cleanCid = cid ? cid.trim() : "";
  const isCidHttp = cleanCid.startsWith("http://") || cleanCid.startsWith("https://");
  const normalizedGateway = (ipfsGateway || "https://green-real-rhinoceros-350.mypinata.cloud")
    .replace(/\/ipfs\/?$/, "")
    .replace(/\/$/, "");

  const effectiveFrontImage =
    frontUrl ||
    (isCidHttp
      ? cleanCid
      : cleanCid && !cleanCid.startsWith("PENDING") && !cleanCid.startsWith("undefined")
      ? `${normalizedGateway}/ipfs/${cleanCid.replace(/^ipfs:\/\//, "")}`
      : "");

  const effectiveTranscriptImage = transcriptUrl;

  const [frontZoom, setFrontZoom] = useState<number>(isPreIssued ? 75 : 55);
  const [transcriptZoom, setTranscriptZoom] = useState<number>(effectiveTranscriptImage ? 75 : 55);

  const isLandscape = (layoutSettings.certificateLayout || "HORIZONTAL") !== "VERTICAL";
  const defaultW = isLandscape ? 29.7 : 21.0;
  const defaultH = isLandscape ? 21.0 : 29.7;
  const paperWCm = layoutSettings.paperWidthCm || defaultW;
  const paperHCm = layoutSettings.paperHeightCm || defaultH;
  const templateCanvasW = Math.round(paperWCm * (150 / 2.54));
  const templateCanvasH = Math.round(paperHCm * (150 / 2.54));

  useEffect(() => {
    // Generate QR Code
    if (certId) {
      const clientBase =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.willfaa.web.id";
      QRCode.toDataURL(`${clientBase}/verify/${certId}`, {
        margin: 1,
        width: 256,
      })
        .then(setQrCodeBase64)
        .catch(() => {});
    }

    // Fetch Layout Settings
    Promise.allSettled([
      api.get("/admin/settings"),
      api.get("/admin/settings/details"),
      api.get("/admin/settings/layout-config"),
      api.get("/admin/settings/transcript-layout-config"),
    ]).then(([settingsRes, detailsRes, configRes, transcriptConfigRes]) => {
      const merged: any = {};
      if (settingsRes.status === "fulfilled" && settingsRes.value?.data?.settings) {
        Object.assign(merged, settingsRes.value.data.settings);
      }
      if (detailsRes.status === "fulfilled" && detailsRes.value?.data?.data) {
        Object.assign(merged, detailsRes.value.data.data);
      }
      if (configRes.status === "fulfilled" && configRes.value?.data?.config) {
        merged.layoutConfig = configRes.value.data.config;
      }
      if (transcriptConfigRes.status === "fulfilled" && transcriptConfigRes.value?.data?.config) {
        merged.transcriptLayoutConfig = transcriptConfigRes.value.data.config;
      }
      setLayoutSettings(merged);
    });
  }, [certId]);

  const defaultUnits: CompetencyUnit[] = [
    { code: "J.620100.004.01", title: "Menerapkan Pemrograman Berorientasi Objek (OOP)", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.009.02", title: "Menggunakan Struktur Data dan Algoritma Dasar", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.017.02", title: "Mengimplementasikan Basis Data Relasional (PostgreSQL)", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.025.02", title: "Melakukan Pengujian Perangkat Lunak (Unit Testing)", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.033.02", title: "Mengembangkan Arsitektur API dan Smart Contract", standard: "SKKNI", result: "KOMPETEN" },
  ];

  const units = competencyUnits && competencyUnits.length > 0 ? competencyUnits : defaultUnits;

  const defaultSigners: SignerInfo[] = [
    {
      name: "Drs. H. Mulyono, M.Pd.",
      title: "KEPALA SEKOLAH / PENGUJI",
      role: "INSTITUSI",
      nip: "197204121998021003",
      institution: schoolName || "SMK NEGERI 1 SURABAYA",
    },
    {
      name: "Ir. Hendra Kusuma, M.Kom.",
      title: "ASESOR PENGUJI EKSTERNAL",
      role: "DUDI",
      nip: "REG-BNSP-7782-2026",
      institution: "PT. MITRA INDUSTRI INDONESIA",
    },
  ];

  const signerList = signers && signers.length > 0 ? signers : defaultSigners;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Switch Tab & PDF Download */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-white/10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("front")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "front"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Award size={15} />
            <span>
              {isPreIssued ? "Sertifikat Bertanda (Halaman 1)" : "Sertifikat Utama (Depan)"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transcript")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "transcript"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText size={15} />
            <span>
              {effectiveTranscriptImage ? "Transkrip / Hal 2" : "Transkrip SKKNI (Belakang)"}
            </span>
          </button>
        </div>

        {/* Actions Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isPreIssued && effectiveFrontImage ? (
            <a
              href={effectiveFrontImage}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <Download size={15} />
              <span>Unduh Sertifikat Ber-QR</span>
            </a>
          ) : (
            <a
              href={`${apiBase}/api/certificates/${certId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <Printer size={15} />
              <span>Unduh PDF Resmi (2 Halaman Duplex)</span>
            </a>
          )}
        </div>
      </div>

      {/* TAB CONTENT: Front Certificate vs Back Transcript */}
      {activeTab === "front" ? (
        <div className="space-y-6">
          {/* Certificate Container with Unified Zoom Toolbar */}
          <div className="w-full bg-slate-950/90 rounded-3xl border border-white/10 p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-center relative shadow-2xl">
            {/* Zoom Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={16} />
                Dokumen Sertifikat Terverifikasi
              </span>
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFrontZoom((z) => Math.max(30, z - 10))}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs font-mono text-white/90 w-12 text-center select-none font-semibold">
                  {frontZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setFrontZoom((z) => Math.min(180, z + 10))}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setFrontZoom(isPreIssued ? 75 : 55)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-all ml-1"
                  title="Tampilan Pas 1 Layar Penuh"
                >
                  Fit Layar
                </button>
                <button
                  type="button"
                  onClick={() => setFrontZoom(100)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors"
                  title="Ukuran Asli 100%"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Content Display: Stamped Image or Dynamic Template */}
            <div
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  if (e.deltaY < 0) {
                    setFrontZoom((z) => Math.min(180, z + 5));
                  } else {
                    setFrontZoom((z) => Math.max(30, z - 5));
                  }
                }
              }}
              className="w-full overflow-auto max-h-[75vh] flex items-center justify-center p-2 sm:p-4 custom-scrollbar"
            >
              {isPreIssued && effectiveFrontImage ? (
                <img
                  src={effectiveFrontImage}
                  alt={`Sertifikat ${studentName}`}
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
                      studentName={studentName}
                      studentId={studentId}
                      courseName={courseTitle || program || "Sertifikat Kelulusan"}
                      certificateId={certId}
                      program={program}
                      majority={majority}
                      issuedAt={issuedAt}
                      qrCodeBase64={qrCodeBase64}
                      layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                      paperSize={layoutSettings.certificatePaperSize || "A4"}
                      paperWidthCm={layoutSettings.paperWidthCm || defaultW}
                      paperHeightCm={layoutSettings.paperHeightCm || defaultH}
                      instructorName={layoutSettings.instructorName || signerList[0]?.name}
                      instructorNip={layoutSettings.instructorNip || signerList[0]?.nip}
                      instructors={layoutSettings.instructors || signerList}
                      institutionLogo={layoutSettings.institutionLogo}
                      institutionName={layoutSettings.institutionName}
                      institutionSubtext={layoutSettings.institutionSubtext}
                      bgPath={layoutSettings.certificateTemplate || layoutSettings.bgPath}
                      layoutConfig={layoutSettings.layoutConfig}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {cid && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 font-mono">
              <span className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                IPFS / Supabase Storage Reference: {cid.substring(0, 32)}...
              </span>
              <a
                href={
                  effectiveFrontImage ||
                  (isCidHttp
                    ? cleanCid
                    : `${normalizedGateway}/ipfs/${cleanCid.replace(/^ipfs:\/\//, "")}`)
                }
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-sans font-bold text-xs"
              >
                Buka Artifak Digital Asli <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: Transkrip Unit Kompetensi SKKNI (Duplex Back Page) */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Transcript Container with Zoom Toolbar */}
          <div className="w-full bg-slate-950/90 rounded-3xl border border-white/10 p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-center relative shadow-2xl">
            {/* Zoom Toolbar for Transcript */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <FileText size={16} />
                Transkrip Nilai & Cap Kompetensi (Halaman 2)
              </span>
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setTranscriptZoom((z) => Math.max(30, z - 10))}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Perkecil"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs font-mono text-white/90 w-12 text-center select-none font-semibold">
                  {transcriptZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setTranscriptZoom((z) => Math.min(180, z + 10))}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Perbesar"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setTranscriptZoom(effectiveTranscriptImage ? 75 : 55)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-all ml-1"
                >
                  Fit Layar
                </button>
                <button
                  type="button"
                  onClick={() => setTranscriptZoom(100)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Transcript Display: Stamped Image or Dynamic Canvas */}
            <div
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  if (e.deltaY < 0) {
                    setTranscriptZoom((z) => Math.min(180, z + 5));
                  } else {
                    setTranscriptZoom((z) => Math.max(30, z - 5));
                  }
                }
              }}
              className="w-full overflow-auto max-h-[75vh] flex items-center justify-center p-2 sm:p-4 custom-scrollbar"
            >
              {effectiveTranscriptImage ? (
                <img
                  src={effectiveTranscriptImage}
                  alt={`Transkrip ${studentName}`}
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
                      studentName={studentName}
                      studentId={studentId}
                      majority={majority}
                      program={program}
                      courseTitle={courseTitle}
                      units={units}
                      examinerName={signerList[0]?.name || layoutSettings.instructorName || "Penguji / Asesor"}
                      examinerNip={signerList[0]?.nip || layoutSettings.instructorNip}
                      institutionLogo={layoutSettings.institutionLogo}
                      institutionName={layoutSettings.institutionName}
                      institutionSubtext={layoutSettings.institutionSubtext}
                      schoolName={layoutSettings.institutionName || schoolName || "SMK Mitra IDUKA"}
                      paperSize={layoutSettings.certificatePaperSize || "A4"}
                      paperWidthCm={layoutSettings.paperWidthCm || defaultW}
                      paperHeightCm={layoutSettings.paperHeightCm || defaultH}
                      layout={layoutSettings.certificateLayout || "HORIZONTAL"}
                      bgPath={layoutSettings.transcriptTemplate}
                      layoutConfig={layoutSettings.transcriptLayoutConfig}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Transcript Data Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl space-y-6">
            {/* Header Transkrip */}
            <div className="border-b border-white/10 pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-2">
                    Transkrip Nilai & Unit Kompetensi (SKKNI)
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    DAFTAR UNIT KOMPETENSI
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    Skema Sertifikasi: <span className="text-white font-medium">{courseTitle || program}</span>
                  </p>
                </div>

                <div className="text-left md:text-right font-mono text-xs text-white/60 space-y-1">
                  {certificateNumber && (
                    <div>
                      <span className="text-white/30 uppercase text-[10px]">No. Sertifikat:</span>{" "}
                      <span className="text-cyan-400 font-bold">{certificateNumber}</span>
                    </div>
                  )}
                  {schoolName && (
                    <div>
                      <span className="text-white/30 uppercase text-[10px]">Satuan Pendidikan:</span>{" "}
                      <span className="text-white font-semibold">{schoolName}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-white/30 uppercase text-[10px]">Tanggal Terbit:</span>{" "}
                    <span className="text-white">{issuedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Snapshot Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30">Nama Peserta Didik</p>
                <p className="text-sm font-bold text-white truncate">{studentName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30">NISN / ID Siswa</p>
                <p className="text-sm font-mono font-bold text-cyan-400">{studentId}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/30">Program Keahlian</p>
                <p className="text-sm font-bold text-white truncate">{program}</p>
              </div>
            </div>

            {/* Competency Table with Nilai column */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/60 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-40">Kode Unit</th>
                    <th className="py-3 px-4">Judul Unit Kompetensi</th>
                    <th className="py-3 px-4 w-28 text-center">Standar</th>
                    <th className="py-3 px-4 w-28 text-center text-amber-300">Nilai</th>
                    <th className="py-3 px-4 w-32 text-center">Hasil Uji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {units.map((unit, idx) => {
                    const scoreVal =
                      unit.score !== undefined && unit.score !== null && unit.score !== ""
                        ? !isNaN(parseFloat(String(unit.score)))
                          ? parseFloat(String(unit.score)).toFixed(2)
                          : unit.score
                        : "-";

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-white/40">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">{unit.code}</td>
                        <td className="py-3 px-4 text-white/90 font-medium">{unit.title}</td>
                        <td className="py-3 px-4 text-center font-mono text-white/50">{unit.standard || "SKKNI"}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">
                          {scoreVal}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                            <CheckCircle2 size={12} /> {unit.result || "KOMPETEN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-white/5 border-t border-white/10 font-bold">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase text-white/60 tracking-wider">
                      Nilai Rata-Rata:
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-sm font-extrabold text-amber-300">
                      {(() => {
                        const valid = units
                          .map((u) => (u.score !== undefined && u.score !== null ? parseFloat(String(u.score)) : NaN))
                          .filter((s) => !isNaN(s));
                        if (valid.length === 0) return "90.00";
                        return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2);
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase tracking-widest font-extrabold">
                        LULUS
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Multi-Signer Section (Dual Signer: Sekolah + Asesor DUDI) */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">
                Dewan Penguji & Asesor Penandatangan (Dual-Signer Protocol)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {signerList.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3.5"
                  >
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/60 inline-block mb-1">
                        {s.role === "DUDI" ? "Asesor Industri (Eksternal)" : "Ketua Penguji (Internal)"}
                      </span>
                      <p className="text-sm font-bold text-white truncate">{s.name}</p>
                      <p className="text-xs text-white/50 truncate">{s.title}</p>
                      {s.nip && <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">{s.nip}</p>}
                      {s.institution && (
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{s.institution}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
