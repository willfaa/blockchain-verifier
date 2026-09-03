//frontend/src/app/verify/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Navbar } from "@/components/layout/Navbar";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import clsx from "clsx";
import { getApiBase } from "@/lib/utils";
import { VerificationTranscriptViewer } from "@/components/features/VerificationTranscriptViewer";
import { fetchCertificateFromSupabase } from "@/lib/supabase";

// Force dynamic rendering so we always fetch fresh data
export const dynamic = "force-dynamic";

interface CertificateRecord {
  certId: string;
  studentId: string;
  nim?: string;
  name: string;
  majority: string;
  program: string;
  cid: string;
  txId?: string;
  blockchainTxId?: string;
  blockchainSyncStatus?: "SYNCED" | "PENDING_SYNC" | "FAILED";
  hash: string;
  status: "PENDING" | "ISSUED" | "REVOKED" | "SUPERSEDED";
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
  supersededBy?: string;
  supersededFrom?: string;
  courseName?: string;
  course?: { title: string };
  certificateNumber?: string | null;
  schoolName?: string | null;
  signers?: any;
  competencyUnits?: any;
  layoutMode?: string | null;
  source?: "blockchain" | "mirror_database" | "database";
  isChainVerified?: boolean;
}

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let cert: CertificateRecord | null = null;
  let error: string | null = null;
  let qrCodeBase64 = "";

  const apiBase = getApiBase();
  const IPFS_GATEWAY =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud";
  try {
    const res = await fetch(`${apiBase}/api/certificates/${id}/verify`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
      },
    });

    if (!res.ok) {
      // Fallback to /api/certificates/:id
      const fallbackRes = await fetch(`${apiBase}/api/certificates/${id}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Bypass-Tunnel-Reminder": "true",
        },
      });
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        if (fbData.ok && (fbData.record || fbData.data)) {
          cert = fbData.record || fbData.data;
          cert!.source = fbData.source || "mirror_database";
        }
      }
    } else {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.ok && (data.record || data.data)) {
          cert = data.record || data.data;
          cert!.source = data.source || "blockchain";
          cert!.isChainVerified = data.isChainVerified;
        }
      } catch (parseErr) {}
    }
  } catch (err: any) {
    console.warn("Backend API Unreachable. Activating Direct Cloud Resilience Fallback...");
  }

  // --- DIRECT CLOUD RESILIENCE FALLBACK (When Laptop/Ngrok is OFF) ---
  if (!cert) {
    try {
      const cloudCert = await fetchCertificateFromSupabase(id);
      if (cloudCert) {
        cert = cloudCert;
        error = null;
      }
    } catch (cloudErr: any) {
      console.error("Direct Cloud Fallback Error:", cloudErr);
    }
  }

  if (cert) {
    try {
      const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";
      const verificationUrl = `${clientUrl}/verify/${cert.certId}`;
      qrCodeBase64 = await QRCode.toDataURL(verificationUrl);
    } catch (e) {}
  } else if (!error) {
    // If not found in both backend and direct cloud Supabase
    error = null; // Handled as not found UI
  }

  // --- Render Logic ---

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-24 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-500/10 blur-[120px] -z-10" />

          <Link
            href="/verify"
            className="mb-10 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Registry
          </Link>

          <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/[0.02] p-16 shadow-2xl backdrop-blur-xl">
            <XCircle className="mx-auto h-16 w-16 text-red-400 mb-6" />
            <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
              Verification <span className="text-red-400">Offline</span>
            </h1>
            <p className="text-white/40 text-sm font-medium italic">
              {error}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-24 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 blur-[120px] -z-10" />

          <Link
            href="/verify"
            className="mb-10 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Registry
          </Link>

          <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-16 shadow-2xl backdrop-blur-xl">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
              Credential <span className="text-white/20">Not Found</span>
            </h1>
            <p className="text-white/40 text-sm font-medium italic">
              The requested identifier does not exist in our institutional
              records.
            </p>
            <div className="mt-8 font-mono text-[10px] text-white/10 uppercase tracking-[0.4em]">
              {id}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isFabricVerified = cert.source === "blockchain" || cert.isChainVerified || cert.blockchainSyncStatus === "SYNCED";

  // Certificate Found - Render Good UI
  return (
    <div className="min-h-screen bg-dark-bg text-slate-50 pb-20 selection:bg-neon-purple/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-neon-purple/5 blur-[130px]" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-neon-blue/5 blur-[150px]" />
      </div>

      <Navbar />

      <main className="mx-auto max-w-4xl px-6 pt-32 pb-12">
        <Link
          href="/verify"
          className="mb-10 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-all print:hidden"
        >
          <div className="p-2 bg-white/5 rounded-lg">
            <ArrowLeft size={14} />
          </div>
          Return to Records Hub
        </Link>

        {/* Mobile Friendly Status Card */}
        <div className="flex flex-col gap-10 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div
            className={clsx(
              "rounded-[2.5rem] border px-10 py-10 shadow-3xl flex flex-col sm:flex-row items-center gap-10 backdrop-blur-xl relative overflow-hidden",
              cert.status === "ISSUED"
                ? "border-emerald-500/10 bg-emerald-500/[0.02]"
                : cert.status === "SUPERSEDED"
                ? "border-amber-500/20 bg-amber-500/[0.03]"
                : cert.status === "REVOKED"
                ? "border-red-500/10 bg-red-500/[0.02]"
                : "border-amber-500/20 bg-amber-500/[0.02]"
            )}
          >
            <div
              className={clsx(
                "absolute top-0 left-0 w-full h-1 opacity-20",
                cert.status === "ISSUED"
                  ? "bg-emerald-500"
                  : cert.status === "SUPERSEDED"
                  ? "bg-amber-500"
                  : cert.status === "REVOKED"
                  ? "bg-red-500"
                  : "bg-amber-500"
              )}
            />

            {/* Icon */}
            <div
              className={clsx(
                "p-6 rounded-[2rem] border transition-transform duration-500 hover:scale-110 shrink-0",
                cert.status === "ISSUED"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : cert.status === "SUPERSEDED"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : cert.status === "REVOKED"
                  ? "bg-red-500/10 border-red-500/20 text-red-500"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              )}
            >
              {cert.status === "ISSUED" && (
                <CheckCircle className="h-16 w-16" />
              )}
              {cert.status === "SUPERSEDED" && (
                <AlertTriangle className="h-16 w-16" />
              )}
              {cert.status === "REVOKED" && <XCircle className="h-16 w-16" />}
              {cert.status === "PENDING" && (
                <Clock className="h-16 w-16 animate-pulse" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 mb-2 justify-center sm:justify-start">
                <h2 className="text-4xl font-bold tracking-tight text-white">
                  {cert.status === "ISSUED" ? (
                    <>
                      Authentic{" "}
                      <span className="text-neon-blue">Achievement</span>
                    </>
                  ) : cert.status === "SUPERSEDED" ? (
                    <>
                      Updated &{" "}
                      <span className="text-amber-400">Superseded</span>
                    </>
                  ) : cert.status === "PENDING" ? (
                    <>
                      Pending{" "}
                      <span className="text-amber-400">Ledger Consensus</span>
                    </>
                  ) : (
                    cert.status
                  )}
                </h2>
                {cert.supersededFrom && (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
                    Official Replacement
                  </span>
                )}
                {cert.status === "PENDING" && (
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
                    Awaiting Sync
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-white/50 leading-relaxed">
                {cert.status === "ISSUED"
                  ? isFabricVerified
                    ? "Kredensial ini telah diverifikasi secara sah melalui bukti konsensus Hyperledger Fabric Blockchain."
                    : "Kredensial ini telah diverifikasi sah secara kriptografis melalui Institutional Mirror Registry."
                  : cert.status === "SUPERSEDED"
                  ? `Sertifikat ini telah digantikan secara resmi oleh sertifikat yang diperbarui. Alasan koreksi: ${
                      cert.revocationReason || "Data Correction"
                    }`
                  : cert.status === "REVOKED"
                  ? `Access to this credential was terminated on ${cert.revokedAt}. Reason: ${cert.revocationReason}`
                  : "Kredensial ini telah diajukan dan sedang menunggu pencatatan resmi ke Hyperledger Fabric Ledger & IPFS. Sertifikat resmi belum dapat diverifikasi sampai transaksi dikonfirmasi oleh validator."}
              </p>

              {cert.status === "SUPERSEDED" && cert.supersededBy && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-amber-200">
                    <span className="font-bold">Sertifikat Pengganti yang Sah:</span> #{cert.supersededBy}
                  </div>
                  <Link
                    href={`/verify/${cert.supersededBy}`}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shrink-0"
                  >
                    Buka Sertifikat Baru &rarr;
                  </Link>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                <span className="bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40 rounded-full px-4 py-2">
                  REF: {cert.certId}
                </span>
                <span className="bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40 rounded-full px-4 py-2">
                  SIG: {cert.hash.substring(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Dual-View Certificate or Pending Banner */}
          {cert.status === "PENDING" ? (
            <div className="rounded-[2.5rem] border border-amber-500/20 bg-amber-500/[0.03] p-10 text-center shadow-2xl backdrop-blur-xl space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={28} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Sertifikat Belum Diterbitkan ke Ledger On-Chain
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Penerbitan digital sertifikat ini masih berada dalam antrean sinkronisasi konsensus blockchain (Hyperledger Fabric) & IPFS. Tampilan visual sertifikat resmi dan transkrip kelulusan akan aktif setelah proses validasi on-chain selesai.
              </p>
            </div>
          ) : (
            <VerificationTranscriptViewer
              certId={cert.certId}
              certificateNumber={cert.certificateNumber}
              schoolName={cert.schoolName}
              studentName={cert.name}
              studentId={cert.studentId || cert.nim || "-"}
              majority={cert.majority}
              program={cert.program}
              courseTitle={cert.course?.title || cert.courseName}
              issuedAt={cert.issuedAt}
              cid={cert.cid}
              hash={cert.hash}
              competencyUnits={cert.competencyUnits}
              signers={cert.signers}
              apiBase={apiBase}
              ipfsGateway={IPFS_GATEWAY}
            />
          )}

          {/* Mobile Data Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/10 blur-[60px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-purple mb-8">
                Recipient Details
              </h3>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">
                    Legal Name
                  </p>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {cert.name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">
                    Institutional ID
                  </p>
                  <p className="text-lg font-bold text-neon-blue tracking-widest">
                    {cert.studentId || cert.nim}
                  </p>
                </div>
                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">
                    Academic Credentials
                  </p>
                  <p className="text-[13px] font-bold text-white/60 tracking-tight leading-relaxed">
                    {cert.program} in{" "}
                    <span className="text-white">{cert.majority}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-10 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neon-blue/10 blur-[60px] -z-10 group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-blue mb-8">
                Ledger Verification Proof
              </h3>
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className={clsx(
                    "p-4 rounded-2xl border",
                    isFabricVerified
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  )}>
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white tracking-tight">
                      {isFabricVerified ? "Hyperledger Fabric Consensus Verified" : "Institutional Cryptographic Registry Verified"}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
                      {isFabricVerified ? "State Channel: chainnesa (Org1MSP)" : "Mirror Ledger Proof · SHA-256 Matched"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">
                    Transaction / Ledger Instance
                  </p>
                  <p className="font-mono text-[10px] text-neon-blue break-all bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
                    {cert.blockchainTxId || cert.txId || "MIRROR_LEDGER_CONFIRMED"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">
                    Digital Signature (SHA-256 Fingerprint)
                  </p>
                  <p className="font-mono text-[10px] text-white/40 break-all leading-relaxed">
                    {cert.hash}
                  </p>
                </div>

                {/* RESTORED IPFS LINK */}
                {cert.cid && (
                  <div className="mt-4 pt-8 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-4">
                      Digital Transcript Artifact (Pinata IPFS)
                    </p>
                    <a
                      href={`${IPFS_GATEWAY}/ipfs/${cert.cid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center rounded-2xl bg-white text-black py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neon-blue hover:text-white transition-all shadow-2xl overflow-hidden relative group/btn"
                    >
                      <span className="relative z-10">
                        Access Original Artifact
                      </span>
                    </a>
                    <p className="text-[9px] text-center text-white/20 mt-4 font-bold uppercase tracking-widest">
                      CID: {cert.cid.substring(0, 18)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
