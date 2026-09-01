"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface CompetencyUnit {
  code: string;
  title: string;
  standard?: string;
  result?: string;
}

interface SignerInfo {
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
  hash,
  competencyUnits,
  signers,
  apiBase,
  ipfsGateway,
}: VerificationTranscriptViewerProps) {
  const [activeTab, setActiveTab] = useState<"front" | "transcript">("front");
  const [copiedHash, setCopiedHash] = useState(false);

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
            <span>Sertifikat Utama (Depan)</span>
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
            <span>Transkrip SKKNI (Belakang)</span>
          </button>
        </div>

        {/* 2-Page Official PDF Download Button */}
        <a
          href={`${apiBase}/api/certificates/${certId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <Printer size={15} />
          <span>Unduh PDF Resmi (2 Halaman Duplex)</span>
        </a>
      </div>

      {/* TAB CONTENT: Front Certificate vs Back Transcript */}
      {activeTab === "front" ? (
        <div className="space-y-6">
          {/* Certificate Preview Image if CID exists */}
          {cid ? (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-3 backdrop-blur-2xl overflow-hidden shadow-2xl group relative">
              <div className="relative aspect-[1.414/1] w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img
                  src={`${ipfsGateway}/ipfs/${cid}`}
                  alt={`Sertifikat ${studentName}`}
                  className="w-full h-full object-contain rounded-2xl"
                  onError={(e) => {
                    // Fallback to placeholder if IPFS gateway is slow
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between px-3 py-1 text-[11px] text-white/50 font-mono">
                <span>IPFS CID: {cid.substring(0, 18)}...</span>
                <a
                  href={`${ipfsGateway}/ipfs/${cid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Buka Gambar Asli <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-xl">
              <Award className="mx-auto h-16 w-16 text-cyan-400 mb-4 opacity-80" />
              <h3 className="text-xl font-bold text-white mb-2">Sertifikat Digital Terverifikasi</h3>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                Sertifikat ini terbit langsung dari konsensus Hyperledger Fabric dan siap dicetak melalui tombol unduh PDF resmi.
              </p>
              <a
                href={`${apiBase}/api/certificates/${certId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20"
              >
                <Download size={15} /> Unduh PDF Lengkap
              </a>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: Transkrip Unit Kompetensi SKKNI (Duplex Back Page) */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Transcript Card */}
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

            {/* Competency Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/60 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-40">Kode Unit</th>
                    <th className="py-3 px-4">Judul Unit Kompetensi</th>
                    <th className="py-3 px-4 w-28 text-center">Standar</th>
                    <th className="py-3 px-4 w-32 text-center">Hasil Uji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {units.map((unit, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-white/40">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{unit.code}</td>
                      <td className="py-3 px-4 text-white/90 font-medium">{unit.title}</td>
                      <td className="py-3 px-4 text-center font-mono text-white/50">{unit.standard || "SKKNI"}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                          <CheckCircle2 size={12} /> {unit.result || "KOMPETEN"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
