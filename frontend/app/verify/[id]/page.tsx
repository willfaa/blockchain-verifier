//frontend/src/app/verify/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Navbar } from "@/components/layout/Navbar";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import clsx from "clsx";

// Force dynamic rendering so we always fetch fresh data
export const dynamic = "force-dynamic";

interface CertificateRecord {
  certId: string;
  nim: string;
  name: string;
  majority: string;
  program: string;
  cid: string; // RESTORED
  txId?: string;
  hash: string;
  status: "PENDING" | "ISSUED" | "REVOKED";
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
  courseName?: string;
  course?: { title: string };
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

  try {
    const res = await fetch(`http://127.0.0.1:4000/api/certificates/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) {
        // Certificate not found, handle null cert
      } else {
        const text = await res.text(); // Read error body
        error = `Server Error: ${res.status}. ${text.substring(0, 100)}`;
      }
    } else {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.ok && data.record) {
          cert = data.record;

          // Generate QR Code server-side
          const verificationUrl = `http://localhost:3000/verify/${
            cert!.certId
          }`;
          qrCodeBase64 = await QRCode.toDataURL(verificationUrl);
        } else {
          error = data.error || "Invalid response format";
        }
      } catch (parseErr) {
        console.error("JSON Parse Error. URL:", res.url);
        console.error("Response Text:", text);
        error = `Invalid Server Response (Not JSON). Got: ${text.substring(
          0,
          20
        )}`;
      }
    }
  } catch (err: any) {
    console.error("Verification Fetch Error:", err);
    error = err.message || "Failed to connect to backend";
  }

  // --- Render Logic ---

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-12 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-900/10 p-8 shadow-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-100">
              Verification Error
            </h1>
            <p className="text-red-300 mt-2">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
        <Navbar />
        <main className="mx-auto max-w-4xl px-6 py-12 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          <div className="rounded-xl border border-white/10 p-12">
            <h1 className="text-2xl font-bold text-white">
              Certificate Not Found
            </h1>
            <p className="text-slate-400 mt-2">
              The requested ID does not exist in our registry.
            </p>
            <div className="mt-4 font-mono text-sm text-slate-500">{id}</div>
          </div>
        </main>
      </div>
    );
  }

  // Certificate Found - Render Good UI
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50 pb-20">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors print:hidden"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Verify Another ID
        </Link>

        {/* Mobile Friendly Status Card */}
        <div className="flex flex-col gap-6 print:hidden">
          <div
            className={clsx(
              "rounded-xl border px-6 py-6 shadow-xl flex flex-col sm:flex-row items-center gap-6",
              cert.status === "ISSUED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : cert.status === "REVOKED"
                ? "border-red-500/30 bg-red-500/10 text-red-100"
                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
            )}
          >
            {/* Icon */}
            <div
              className={clsx(
                "p-4 rounded-full",
                cert.status === "ISSUED"
                  ? "bg-emerald-500/20"
                  : cert.status === "REVOKED"
                  ? "bg-red-500/20"
                  : "bg-yellow-500/20"
              )}
            >
              {cert.status === "ISSUED" && (
                <CheckCircle className="h-12 w-12 text-emerald-400" />
              )}
              {cert.status === "REVOKED" && (
                <XCircle className="h-12 w-12 text-red-400" />
              )}
              {cert.status === "PENDING" && (
                <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-bold uppercase tracking-tight">
                {cert.status === "ISSUED" ? "Verified & Valid" : cert.status}
              </h2>
              <p className="text-sm opacity-80 mt-1">
                {cert.status === "ISSUED"
                  ? "This certificate is authentic and recorded on the blockchain."
                  : cert.status === "REVOKED"
                  ? `This certificate was revoked on ${cert.revokedAt}. Reason: ${cert.revocationReason}`
                  : "This certificate is currently pending confirmation."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-mono opacity-70">
                <span className="bg-black/20 rounded px-2 py-1">
                  ID: {cert.certId}
                </span>
                <span className="bg-black/20 rounded px-2 py-1">
                  Hash: {cert.hash.substring(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Data Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Student Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  <p className="text-lg font-bold text-white">{cert.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Student ID (NIM)</p>
                  <p className="text-lg font-mono text-cyan-300">{cert.nim}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Program & Majority</p>
                  <p className="text-base text-slate-200">
                    {cert.program} in {cert.majority}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur flex flex-col justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Blockchain Proof
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Immutable Record
                    </p>
                    <p className="text-xs text-slate-400">
                      Anchored on Hyperledger Fabric
                    </p>
                  </div>
                </div>

                <div className="mt-2 text-xs">
                  <p className="uppercase text-slate-500 mb-1">
                    Transaction ID
                  </p>
                  <p className="font-mono text-cyan-300 break-all bg-black/20 p-2 rounded border border-white/5">
                    {cert.txId || "PENDING_CONSENSUS"}
                  </p>
                </div>

                <div className="mt-2 text-xs">
                  <p className="uppercase text-slate-500 mb-1">
                    Data Hash (SHA-256)
                  </p>
                  <p className="font-mono text-slate-300 break-all">
                    {cert.hash}
                  </p>
                </div>

                {/* RESTORED IPFS LINK */}
                {cert.cid && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">
                      STORED ON IPFS
                    </p>
                    <a
                      href={`http://127.0.0.1:8080/ipfs/${cert.cid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
                    >
                      View Original File
                    </a>
                    <p className="text-[10px] text-center text-slate-500 mt-2 font-mono">
                      CID: {cert.cid.substring(0, 15)}...
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
