"use client";

import { FormEvent, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";

interface VerifyResult {
  ok?: boolean;
  reason?: string;
  source?: string;
  fabricError?: string;
  certId?: string;
  studentId?: string;
  nim?: string;
  name?: string;
  majority?: string;
  program?: string;
  cid?: string;
  txId?: string;
  hash?: string;
  status?: string;
  issuedAt?: string;
  note?: string;
  onChain?: boolean;
  fabricAnchor?: any;
  error?: string;
  [key: string]: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const BACKEND_URL = `${API_BASE}/api/certificates`;
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "http://localhost:8080/ipfs";

export default function VerifyPage() {
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Restore cached certId
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem("verifyCertId");
    if (cached) setCertId(cached);
  }, []);

  // Cache certId on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("verifyCertId", certId);
  }, [certId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      // Use GET instead of POST, and point to the correct verify endpoint
      const res = await fetch(`${BACKEND_URL}/${certId}/verify`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
      });

      const data = await res.json();

      // backend may return 200 with ok=false (revoked, superseded, etc.)
      if (!res.ok || data?.ok === false) {
        setErrorMsg(data?.error || data?.reason || "Verification failed");
        return;
      }

      const payload = data.data || data.record || data;
      setResult({
        ...payload,
        // derive helpful flags
        onChain: data.source === "blockchain" || data.source === "fabric",
        note: data.fabricError
          ? `Fabric warning: ${data.fabricError}`
          : payload.note,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const ipfsUrl = result && result.cid ? `${IPFS_GATEWAY}/${result.cid}` : null;
  const downloadName = result?.certId
    ? `${result.certId}.pdf`
    : "certificate.pdf";
  const fileLabel = result?.certId || "File preview";

  async function handleDownload() {
    if (!ipfsUrl) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(ipfsUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err?.message || "Failed to download file");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-50 selection:bg-neon-purple/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-neon-purple/10 blur-[130px] animate-pulse" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-neon-blue/10 blur-[150px]" />
      </div>

      <Navbar />

      <main className="relative mx-auto flex max-w-6xl flex-col px-6 pt-32 pb-16 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Verify form + result */}
          <section className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10 shadow-3xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-purple opacity-20" />

            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neon-blue mb-6">
              Institutional Records Hub
              <div className="h-1 w-1 rounded-full bg-neon-blue animate-ping" />
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight">
              Credential{" "}
              <span className="galaxy-gradient-text">Validation</span>
            </h1>

            <p className="mt-4 text-[13px] text-white/40 font-medium leading-relaxed">
              Authenticate academic achievements through our secure
              institutional ledger. Enter the unique{" "}
              <code className="text-neon-purple font-bold px-1.5 py-0.5 bg-neon-purple/10 rounded-md">
                Credential ID
              </code>{" "}
              provided on the physical certificate or digital transcript.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div className="group/input relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity" />
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 ml-1">
                    Credential Identifier
                  </label>
                  <input
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white outline-none ring-0 placeholder:text-white/20 transition-all focus:border-neon-purple/30 focus:bg-white/[0.08]"
                    placeholder="e.g. CERT-1732312345678"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group/btn relative inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-neon-purple hover:text-white disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? "Validating Ledger..." : "Validate Achievement"}
                </span>
              </button>
            </form>

            {errorMsg && (
              <div className="mt-8 flex items-start gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-[11px] font-bold uppercase tracking-widest text-red-400">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                <span>Error: {errorMsg}</span>
              </div>
            )}

            {result && !errorMsg && (
              <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-8 shadow-inner overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 blur-3xl -z-10" />

                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-purple opacity-80">
                      Assessment Result
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Authentic
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Achievement Identifier
                      </p>
                      <p className="font-mono text-[11px] font-bold text-white tracking-tight">
                        {result.certId}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Session Status
                      </p>
                      <p className="text-[11px] font-bold text-neon-blue uppercase tracking-widest">
                        {result.status}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Student ID
                      </p>
                      <p className="text-[11px] font-bold text-white uppercase tracking-widest">
                        {result.studentId || result.nim}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Recipient Name
                      </p>
                      <p className="text-[11px] font-bold text-white uppercase tracking-widest">
                        {result.name}
                      </p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Academic Program
                      </p>
                      <p className="text-[11px] font-bold text-white uppercase tracking-widest">
                        {result.program} in {result.majority}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Certification Date
                      </p>
                      <p className="text-[11px] font-bold text-white/60">
                        {result.issuedAt
                          ? new Date(result.issuedAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                        Ledger Verification
                      </p>
                      <p className="text-[11px] font-bold text-neon-purple uppercase tracking-widest flex items-center gap-2">
                        {result.onChain ? (
                          <>Found in Records Hub</>
                        ) : (
                          <span className="text-white/20">Awaiting Record</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                        Institutional Signature (SHA-256)
                      </p>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-[9px] break-all text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                        {result.hash}
                      </div>
                    </div>
                    {result.cid && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2">
                          Digital Artifact Reference
                        </p>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-[9px] break-all text-white/40 leading-relaxed">
                          {result.cid}
                        </div>
                      </div>
                    )}
                  </div>

                  {result.note && (
                    <div className="mt-6 p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/10 text-[10px] font-bold uppercase tracking-widest text-neon-blue/60 leading-relaxed">
                      {result.note}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Side info / IPFS Preview */}
          <div className="flex flex-col gap-10">
            {result && !errorMsg ? (
              /* IPFS preview */
              <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] overflow-hidden shadow-3xl backdrop-blur-xl h-fit sticky top-12 group/preview">
                <div className="flex items-center justify-between gap-6 px-8 py-6 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-neon-blue uppercase tracking-widest">
                      Ledger
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-bold text-white tracking-tight">
                        {fileLabel || "Achievement Transcript"}
                      </p>
                      {result?.cid && (
                        <p className="font-bold text-[9px] uppercase tracking-widest text-white/20 mt-1">
                          CID: {result.cid.substring(0, 12)}...
                        </p>
                      )}
                    </div>
                  </div>
                  {ipfsUrl && (
                    <div className="flex items-center gap-3">
                      <a
                        href={ipfsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 transition hover:text-white hover:bg-neon-blue hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                        aria-label="Open in new tab"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.25 4.5h5.25m0 0v5.25m0-5.25L12 12"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.75 9.75h-3a2.25 2.25 0 00-2.25 2.25v6.75A2.25 2.25 0 006.75 21h6.75a2.25 2.25 0 002.25-2.25v-3"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 transition hover:text-white hover:bg-neon-purple hover:border-neon-purple hover:shadow-[0_0_15px_rgba(176,38,255,0.3)] disabled:opacity-30"
                        aria-label="Download file"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v12m0 0l-4.5-4.5M12 16.5l4.5-4.5M4.5 19.5h15"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                {downloadError && (
                  <p className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/5">
                    {downloadError}
                  </p>
                )}

                {ipfsUrl ? (
                  <div className="flex h-[450px] items-center justify-center bg-black/40 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                    <iframe
                      src={ipfsUrl}
                      className="h-full w-full border-0 opacity-80 group-hover/preview:opacity-100 transition-opacity"
                      title="Digital Ledger Preview"
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">
                      Signature Required
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.01] p-12 text-center space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                  Verification Pending
                </div>
                <p className="text-[11px] text-white/10 font-medium uppercase tracking-widest">
                  Confirm the validity of digital transcripts in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
