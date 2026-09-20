"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  Search,
  RefreshCw,
  Copy,
  Check,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function CertificateLedgerPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SYNCED" | "PENDING_SYNC" | "PRE_ISSUED">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState("issuedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const IPFS_GATEWAY =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud";

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      // Fetch from API or fallback
      const res = await api.get("/admin/certificates");
      if (res.data.ok && Array.isArray(res.data.data)) {
        setCerts(res.data.data);
      } else if (res.data.recentActivity) {
        setCerts(res.data.recentActivity);
      } else {
        // Direct Next.js API fallback
        const directRes = await fetch("/api/admin/certificates");
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.ok && Array.isArray(directData.data)) {
            setCerts(directData.data);
          }
        }
      }
    } catch (err) {
      console.warn("Express backend certificates lookup fallback to direct API:", err);
      try {
        const directRes = await fetch("/api/admin/certificates");
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.ok && Array.isArray(directData.data)) {
            setCerts(directData.data);
          }
        }
      } catch (fallbackErr) {
        console.error("Failed to load certificates:", fallbackErr);
        toast.error("Gagal memuat daftar log transaksi sertifikat.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Disalin ke clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter & Search Logic
  const filteredCerts = useMemo(() => {
    return certs
      .filter((r) => {
        // Status Filter
        if (statusFilter === "SYNCED" && r.blockchainSyncStatus !== "SYNCED" && r.status !== "ISSUED") return false;
        if (statusFilter === "PENDING_SYNC" && (r.blockchainSyncStatus === "SYNCED" || r.status === "ISSUED")) return false;
        if (statusFilter === "PRE_ISSUED" && r.layoutMode !== "PRE_ISSUED_STAMP") return false;

        // Search Query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const studentName = (r.studentName || r.name || "").toLowerCase();
        const studentId = (r.studentId || r.nim || r.nisn || "").toLowerCase();
        const certId = (r.certId || r.id || "").toLowerCase();
        const certNum = (r.certificateNumber || "").toLowerCase();
        const program = (r.program || "").toLowerCase();
        const majority = (r.majority || "").toLowerCase();
        const hash = (r.hash || "").toLowerCase();
        const txId = (r.blockchainTxId || r.txId || "").toLowerCase();

        return (
          studentName.includes(q) ||
          studentId.includes(q) ||
          certId.includes(q) ||
          certNum.includes(q) ||
          program.includes(q) ||
          majority.includes(q) ||
          hash.includes(q) ||
          txId.includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[sortBy] || "";
        let valB = b[sortBy] || "";
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [certs, searchQuery, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = certs.length;
    const synced = certs.filter((c) => c.blockchainSyncStatus === "SYNCED" || c.status === "ISSUED").length;
    const preIssued = certs.filter((c) => c.layoutMode === "PRE_ISSUED_STAMP").length;
    const pending = total - synced;
    return { total, synced, preIssued, pending };
  }, [certs]);

  const columns = [
    {
      key: "issuedAt",
      label: "Timestamp / ID",
      sortable: true,
      render: (r: any) => {
        const certId = r.certId || r.id || "CERT-UNKNOWN";
        const dateStr = r.issuedAt || r.createdAt;
        let formattedDate = "-";
        try {
          formattedDate = new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch (e) {
          formattedDate = dateStr || "-";
        }

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-cyan-400 font-bold">{certId}</span>
              <button
                type="button"
                onClick={() => handleCopy(certId, `id-${certId}`)}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
                title="Salin ID"
              >
                {copiedId === `id-${certId}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">{formattedDate}</p>
            {r.layoutMode === "PRE_ISSUED_STAMP" && (
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 font-bold uppercase">
                Stamp 1:1 QR
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "studentName",
      label: "Recipient & Program",
      sortable: true,
      render: (r: any) => (
        <div className="space-y-0.5">
          <p className="font-bold text-white text-xs uppercase">{r.studentName || r.name || "-"}</p>
          <p className="text-[11px] text-cyan-300/80 font-mono">
            NISN: {r.studentId || r.nim || r.nisn || "-"}
          </p>
          <p className="text-[10px] text-slate-400 truncate max-w-xs">{r.program || r.majority || "-"}</p>
        </div>
      ),
    },
    {
      key: "certificateNumber",
      label: "Cert Number & Origin",
      render: (r: any) => (
        <div className="space-y-0.5">
          <p className="font-mono text-xs font-bold text-emerald-400">
            {r.certificateNumber || "UKK/DEFAULT"}
          </p>
          <p className="text-[10px] text-slate-400 truncate max-w-xs">
            {r.schoolName || r.courseName || "SMK Mitra IDUKA"}
          </p>
        </div>
      ),
    },
    {
      key: "hash",
      label: "Merkle Hash & Tx ID",
      render: (r: any) => {
        const txId = r.blockchainTxId || r.txId || "ON_CHAIN_CONSENSUS";
        const hash = r.hash || "";

        return (
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors">
              <ShieldCheck size={12} className="text-cyan-400 shrink-0" />
              <span className="truncate max-w-[120px]">{hash ? hash.substring(0, 16) + "..." : "PENDING_HASH"}</span>
              {hash && (
                <button
                  type="button"
                  onClick={() => handleCopy(hash, `hash-${r.id || r.certId}`)}
                  className="text-slate-500 hover:text-cyan-400"
                >
                  {copiedId === `hash-${r.id || r.certId}` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                </button>
              )}
            </div>
            <div className="text-[9px] text-slate-500 truncate max-w-[140px]" title={txId}>
              Tx: {txId}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Ledger State",
      sortable: true,
      render: (r: any) => {
        const isSynced = r.blockchainSyncStatus === "SYNCED" || r.status === "ISSUED";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
              isSynced
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
            }`}
          >
            {isSynced ? <CheckCircle2 size={11} /> : <Clock size={11} />}
            {isSynced ? "ON-CHAIN" : "PENDING"}
          </span>
        );
      },
    },
    {
      key: "action",
      label: "Proof & Verification",
      render: (r: any) => {
        const certId = r.certId || r.id;
        const cid = r.cid || r.frontUrl;

        // Resolve smart asset URL
        let assetUrl = "";
        if (cid) {
          if (cid.startsWith("http") || cid.startsWith("/storage")) {
            assetUrl = cid;
          } else if (cid.startsWith("Qm") || cid.startsWith("bafy")) {
            assetUrl = `${IPFS_GATEWAY}/ipfs/${cid}`;
          }
        }

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={`/verify/${certId}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-cyan-400 hover:text-slate-950 bg-cyan-500/10 hover:bg-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all uppercase"
            >
              <span>Verifikasi</span>
              <ExternalLink size={10} />
            </a>

            {assetUrl ? (
              <a
                href={assetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-emerald-400 hover:text-slate-950 bg-emerald-500/10 hover:bg-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1 transition-all uppercase"
                title="Buka Berkas IPFS / Storage Asli"
              >
                <span>Aset</span>
                <ExternalLink size={10} />
              </a>
            ) : (
              <span className="text-[9px] text-slate-600 border border-white/5 px-1.5 py-1 rounded">
                Mirror Only
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Transaction <span className="text-cyan-400">Logs & Ledger</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Catatan Terdesentralisasi Seluruh Kredensial, Bukti Konsensus Blockchain & Verifikasi IPFS.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchCertificates}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-white rounded-xl text-xs font-bold border border-cyan-500/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Transaksi</p>
          <p className="text-2xl font-black text-white font-mono">{stats.total}</p>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">On-Chain Consensus</p>
          <p className="text-2xl font-black text-emerald-300 font-mono">{stats.synced}</p>
        </div>
        <div className="p-5 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-500/30 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider">Stamp 1:1 QR Jadi</p>
          <p className="text-2xl font-black text-fuchsia-300 font-mono">{stats.preIssued}</p>
        </div>
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 backdrop-blur-xl space-y-1">
          <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Pending Sync</p>
          <p className="text-2xl font-black text-amber-300 font-mono">{stats.pending}</p>
        </div>
      </div>

      {/* Cyberpunk Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari Nama Siswa, NISN, ID Sertifikat, Hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Semua ({certs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("SYNCED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "SYNCED"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            On-Chain ({stats.synced})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PRE_ISSUED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "PRE_ISSUED"
                ? "bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Stamp 1:1 ({stats.preIssued})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING_SYNC")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "PENDING_SYNC"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending ({stats.pending})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <CyberpunkDataTable
        columns={columns}
        data={filteredCerts}
        isLoading={loading}
        totalItems={filteredCerts.length}
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </div>
  );
}
