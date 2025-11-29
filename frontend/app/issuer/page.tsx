// frontend/app/issuer/page.tsx
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function IssuerPage() {
  const toTitleCase = (value: string) =>
    value.replace(
      /\b\w+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );

  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [majority, setMajority] = useState("");
  const [program, setProgram] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore cached text inputs on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = localStorage.getItem("issuerForm");
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as Partial<Record<string, string>>;
      if (parsed.nim) setNim(parsed.nim);
      if (parsed.name) setName(parsed.name);
      if (parsed.majority) setMajority(parsed.majority);
      if (parsed.program) setProgram(parsed.program);
    } catch (_) {
      // ignore malformed cache
    }
  }, []);

  // Cache text inputs whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = { nim, name, majority, program };
    localStorage.setItem("issuerForm", JSON.stringify(payload));
  }, [nim, name, majority, program]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!nim || !name || !majority || !program) {
      setError("Please fill nim, name, majority, and program.");
      return;
    }

    if (!file) {
      setError("Please choose a certificate file first.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("nim", nim);
      formData.append("name", name);
      formData.append("majority", majority);
      formData.append("program", program);
      formData.append("file", file); // must match upload.single("file") in the backend

      const res = await fetch("http://localhost:4000/issue", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col px-6 py-8 sm:px-10 lg:px-14">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d0b2f]/70 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25">
              Cn
            </div>
            <div>
              <p className="text-sm font-semibold">Chainnesa</p>
              <p className="text-xs text-slate-300">
                Credential issuance portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/"
              className="rounded-full border border-white/25 px-3 py-1.5 font-semibold text-slate-50 transition hover:border-white hover:-translate-y-0.5"
            >
              Back to overview
            </Link>
            <Link
              href="/verify"
              className="hidden rounded-full bg-linear-to-r from-fuchsia-500 via-orange-400 to-amber-300 px-3 py-1.5 font-semibold text-slate-950 shadow-md shadow-fuchsia-500/25 transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Verify a credential
            </Link>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Form issuance */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/25">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-100">
              Issuance
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Issue a new certificate
            </h1>
            <p className="mt-1 text-sm text-slate-200">
              Upload an official credential file and its metadata. The backend
              stores it on IPFS and returns the certId, CID, and file hash.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-200">
                    NIM
                  </label>
                  <input
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                    placeholder="e.g.: 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200">
                    Student name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                    placeholder="e.g.: Budi Santoso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-200">
                    Majority
                  </label>
                  <input
                    value={majority}
                    onChange={(e) => setMajority(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                    placeholder="e.g.: Informatics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200">
                    Program of study
                  </label>
                  <input
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
                    placeholder="e.g.: Bachelor of Informatics"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200">
                  Certificate file
                </label>
                <div className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-200">
                  <input
                    type="file"
                    className="w-full text-xs text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-linear-to-r file:from-fuchsia-500 file:via-orange-400 file:to-amber-300 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-950 hover:file:brightness-110"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  PDF/PNG/JPG up to your infra limits. File is stored via IPFS +
                  MFS; metadata saved to PostgreSQL.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "Issuing..." : "Issue certificate"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-xs rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-red-200">
                Error: {error}
              </p>
            )}

            {result && !error && (
              <div className="mt-4 space-y-2 rounded-lg border border-emerald-400/40 bg-emerald-500/5 p-3 text-xs text-slate-100">
                <p className="font-semibold text-emerald-200">Issue result</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-slate-300">certId</p>
                    <p className="font-semibold">{result.certId}</p>
                  </div>
                  {result.name && (
                    <div>
                      <p className="text-slate-300">name</p>
                      <p className="font-semibold">
                        {toTitleCase(String(result.name))}
                      </p>
                    </div>
                  )}
                  {result.nim && (
                    <div>
                      <p className="text-slate-300">nim</p>
                      <p className="font-semibold">{result.nim}</p>
                    </div>
                  )}
                  {result.majority && (
                    <div>
                      <p className="text-slate-300">majority</p>
                      <p className="font-semibold">
                        {toTitleCase(String(result.majority))}
                      </p>
                    </div>
                  )}
                  {result.program && (
                    <div>
                      <p className="text-slate-300">program</p>
                      <p className="font-semibold">
                        {toTitleCase(String(result.program))}
                      </p>
                    </div>
                  )}
                  {result.status && (
                    <div>
                      <p className="text-slate-300">status</p>
                      <p className="font-semibold">{result.status}</p>
                    </div>
                  )}
                  {result.cid && (
                    <div className="wrap-break-words">
                      <p className="text-slate-300">cid</p>
                      <p className="font-semibold break-all">{result.cid}</p>
                    </div>
                  )}
                  {result.hash && (
                    <div className="wrap-break-words">
                      <p className="text-slate-300">hash</p>
                      <p className="font-semibold break-all">{result.hash}</p>
                    </div>
                  )}
                </div>
                {result.note && (
                  <p className="text-cyan-200">Note: {result.note}</p>
                )}
              </div>
            )}
          </section>

          {/* Side info */}
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 text-sm text-slate-200">
            <p className="text-sm font-semibold text-white">
              Issuance flow overview
            </p>
            <ul className="mt-3 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                Required metadata:{" "}
                <code className="rounded bg-slate-950/60 px-1 py-0.5 text-[0.7rem]">
                  nim, name, majority, program
                </code>
                .
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                Upload the certificate file; backend stores it to IPFS + MFS and
                computes the SHA-256 hash.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                Metadata is stored in PostgreSQL (and can be sent to Fabric once
                chaincode is ready).
              </li>
            </ul>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-100">
              <p className="font-semibold text-white">Current backend APIs</p>
              <p className="mt-2">POST http://localhost:4000/issue</p>
              <p>POST http://localhost:4000/verify</p>
              <p className="mt-2 text-slate-300">
                The issue endpoint returns certId + CID, which you can check on
                the verify page.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
