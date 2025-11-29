// frontend/app/verify/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

interface VerifyResult {
  certId?: string;
  nim?: string;
  name?: string;
  majority?: string;
  program?: string;
  cid?: string;
  hash?: string;
  status?: string;
  issuedAt?: string;
  note?: string;
  onChain?: boolean;
  fabricAnchor?: any;
  error?: string;
  [key: string]: any;
}

const BACKEND_URL = "http://localhost:4000";
const IPFS_GATEWAY = "http://127.0.0.1:8080/ipfs";

export default function VerifyPage() {
  const [certId, setCertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

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
      const res = await fetch(`${BACKEND_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Verification failed");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const ipfsUrl = result && result.cid ? `${IPFS_GATEWAY}/${result.cid}` : null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col px-6 py-8 sm:px-10 lg:px-14">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-blue-500 via-cyan-400 to-emerald-400 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20">
              Cn
            </div>
            <div>
              <p className="text-sm font-semibold">Chainnesa</p>
              <p className="text-xs text-slate-300">
                Certificate verification portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="rounded-full border border-white/20 px-3 py-1 font-medium text-slate-100 transition hover:border-white hover:-translate-y-0.5"
            >
              Back to overview
            </Link>
            <Link
              href="/issuer"
              className="hidden rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow-md shadow-cyan-500/30 transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Issue a credential
            </Link>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
                    <p className="mt-2 text-[0.7rem] uppercase text-slate-400">
                      CID (IPFS)
                    </p>
                    <p className="font-mono text-[0.7rem] break-all text-slate-100">
                      {result.cid}
                    </p>
                    {ipfsUrl && (
                      <p className="mt-2 text-[0.75rem]">
                        <a
                          href={ipfsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 underline hover:text-cyan-200"
                        >
                          Open file on IPFS gateway
                        </a>
                      </p>
                    )}
                  </div>

                  {result.note && (
                    <p className="mt-2 text-[0.75rem] text-slate-200">
                      {result.note}
                    </p>
                  )}
                </div>

                {/* IPFS preview */}
                <div className="rounded-lg border border-white/15 bg-slate-950/70 p-3 text-xs text-slate-100">
                  <p className="font-semibold text-white">
                    File preview (from IPFS)
                  </p>
                  <p className="mt-1 text-[0.75rem] text-slate-300">
                    Preview is loaded directly from the IPFS gateway{" "}
                    <span className="font-mono text-slate-400">
                      127.0.0.1:8080
                    </span>
                    . As long as the SHA-256 hash above matches what is stored
                    on Fabric + DB, the file is considered unchanged.
                  </p>

                  {ipfsUrl ? (
                    <div className="mt-3 h-64 overflow-hidden rounded-md border border-white/10 bg-slate-900">
                      <iframe
                        src={ipfsUrl}
                        className="h-full w-full"
                        title="IPFS preview"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-dashed border-white/15 bg-slate-900/70 p-4 text-[0.8rem] text-slate-400">
                      No verification yet. Enter a{" "}
                      <span className="font-mono">certId</span> then click
                      "Verify certificate".
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Side info */}
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 text-sm text-slate-200">
            <p className="text-sm font-semibold text-white">
              How this verify endpoint works
            </p>
            <ul className="mt-3 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                The frontend sends{" "}
                <code className="rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  certId
                </code>{" "}
                to{" "}
                <code className="rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  POST http://localhost:4000/verify
                </code>
                .
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                Backend reads metadata from PostgreSQL and cross-checks anchors
                on Hyperledger Fabric (strict rail).
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                The IPFS CID is used to render the original file via gateway{" "}
                <code className="rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  127.0.0.1:8080/ipfs/[cid]
                </code>
                , while the SHA-256 hash guarantees file integrity.
              </li>
            </ul>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-100">
              <p className="font-semibold text-white">Current backend APIs</p>
              <p className="mt-2">POST http://localhost:4000/issue</p>
              <p>POST http://localhost:4000/verify</p>
              <p className="mt-2 text-slate-300">
                Both are connected to IPFS, PostgreSQL, and Fabric. The verifier
                only needs the <code>certId</code> to confirm authenticity and
                integrity.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
