"use client";

import { FormEvent, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";

interface VerifyResult {
  ok?: boolean;
  reason?: string;
  source?: string;
  fabricError?: string;
  certId?: string;
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

const BACKEND_URL = "http://127.0.0.1:4000/api/certificates";
const IPFS_GATEWAY = "http://127.0.0.1:8080/ipfs";

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
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto flex max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Verify form + result */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-100">
              Verification
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Verify a certificate by ID
            </h1>
            <p className="mt-1 text-sm text-slate-200">
              Enter the{" "}
              <code className="rounded bg-slate-900/70 px-1 py-0.5 text-[0.75rem]">
                certId
              </code>{" "}
              generated during issuance (e.g., CERT-17323xxxxxxx). The backend
              calls{" "}
              <code className="rounded bg-slate-900/70 px-1 py-0.5 text-[0.75rem]">
                POST /verify
              </code>{" "}
              and returns metadata from PostgreSQL, Fabric (anchor), and IPFS.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200">
                  Certificate ID
                </label>
                <input
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                  placeholder="e.g.: CERT-1732312345678"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify certificate"}
              </button>
            </form>

            {errorMsg && (
              <p className="mt-4 text-xs rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-200">
                Error: {errorMsg}
              </p>
            )}

            {result && !errorMsg && (
              <div className="mt-5 space-y-4">
                {/* Metadata card */}
                <div className="space-y-2 rounded-lg border border-emerald-400/40 bg-emerald-500/5 p-3 text-xs text-slate-100">
                  <p className="font-semibold text-emerald-200">
                    Verification result
                  </p>

                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        Certificate ID
                      </p>
                      <p className="font-mono text-[0.8rem] text-slate-50">
                        {result.certId}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        Status
                      </p>
                      <p className="text-[0.8rem] font-semibold text-emerald-300">
                        {result.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        NIM (Student ID)
                      </p>
                      <p className="text-[0.8rem] text-slate-50">
                        {result.nim}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        Name
                      </p>
                      <p className="text-[0.8rem] text-slate-50">
                        {result.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        Major / Department
                      </p>
                      <p className="text-[0.8rem] text-slate-50">
                        {result.majority}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        Program / Level
                      </p>
                      <p className="text-[0.8rem] text-slate-50">
                        {result.program}
                      </p>
                    </div>

                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        Issued at
                      </p>
                      <p className="text-[0.8rem] text-slate-50">
                        {result.issuedAt
                          ? new Date(result.issuedAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400">
                        On-chain (Fabric)
                      </p>
                      <p className="text-[0.8rem] text-slate-50">
                        {result.onChain ? "Found on Fabric" : "Not found"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-[0.7rem] uppercase text-slate-400">
                      Hash (SHA-256)
                    </p>
                    <p className="font-mono text-[0.7rem] break-all text-slate-100">
                      {result.hash}
                    </p>
                    {result.cid && (
                      <>
                        <p className="mt-2 text-[0.7rem] uppercase text-slate-400">
                          CID (IPFS)
                        </p>
                        <p className="font-mono text-[0.7rem] break-all text-slate-100">
                          {result.cid}
                        </p>
                      </>
                    )}
                  </div>

                  {result.note && (
                    <p className="mt-2 text-[0.75rem] text-slate-200">
                      {result.note}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Side info / IPFS Preview */}
          <div className="flex flex-col gap-6">
            {result && !errorMsg && (
              /* IPFS preview */
              <div className="rounded-2xl border border-white/10 bg-slate-900 text-xs text-slate-100 overflow-hidden shadow-xl shadow-black/25 h-fit sticky top-6">
                <div className="flex items-center justify-between gap-3 bg-slate-900/90 px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-cyan-200">
                      IPFS
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-white">
                        {fileLabel || "IPFS Preview"}
                      </p>
                      {result?.cid && (
                        <p className="font-mono text-[0.7rem] text-slate-400">
                          CID: {result.cid.substring(0, 12)}...
                        </p>
                      )}
                    </div>
                  </div>
                  {ipfsUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={ipfsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                        aria-label="Open in new tab"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
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
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 disabled:opacity-60"
                        aria-label="Download file"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
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
                  <p className="mt-2 px-4 text-[0.7rem] text-red-200">
                    {downloadError}
                  </p>
                )}

                {ipfsUrl ? (
                  <div className="flex h-[32vh] sm:h-[36vh] lg:h-[40vh] items-center justify-center bg-slate-950 overflow-hidden">
                    <div className="h-full w-full max-w-full overflow-hidden border-t border-white/5 bg-slate-900">
                      <iframe
                        src={ipfsUrl}
                        className="h-full w-full border-0"
                        title="IPFS preview"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-dashed border-white/15 bg-slate-900/70 p-4 text-[0.8rem] text-slate-400 m-4">
                    No verification yet. Enter a{" "}
                    <span className="font-mono">certId</span>.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        /* Subtle slate-themed scrollbar */
        body {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.45) rgba(15, 23, 42, 0.7);
        }
        body::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        body::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
        }
        body::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.6);
          border-radius: 9999px;
          border: 2px solid rgba(15, 23, 42, 0.9);
        }
        body::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.8);
        }
      `}</style>
    </div>
  );
}
