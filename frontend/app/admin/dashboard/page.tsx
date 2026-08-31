"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import {
  Users,
  FileText,
  BookOpen,
  UserCheck,
  Activity,
  ActivitySquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Cpu,
  Layers,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Edit3,
  Check,
  ExternalLink,
  ArrowRight,
  WifiOff,
  GitMerge,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data Drift & Correction Requests State
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<any[]>([]);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<any | null>(null);
  const [showSupersedeModal, setShowSupersedeModal] = useState(false);
  const [submittingSupersede, setSubmittingSupersede] = useState(false);

  // Hybrid Mirror Ledger Queue State
  const [syncStats, setSyncStats] = useState({ pendingCount: 0, syncedCount: 0, failedCount: 0 });
  const [isSyncingLedger, setIsSyncingLedger] = useState(false);

  // Form State for Supersede
  const [correctedName, setCorrectedName] = useState("");
  const [correctedProgram, setCorrectedProgram] = useState("");
  const [correctedMajority, setCorrectedMajority] = useState("");
  const [supersedeReason, setSupersedeReason] = useState("");
  const [updateUserProfile, setUpdateUserProfile] = useState(true);

  const isMountedRef = useRef(true);

  // Fetch stats and integrity checks from backend
  const fetchStats = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const [statsRes, discRes, reqRes, syncStatsRes] = await Promise.allSettled([
        api.get("/admin/stats"),
        api.get("/certificates/discrepancies"),
        api.get("/certificates/correction-requests?status=PENDING"),
        api.get("/certificates/sync-stats"),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setIsBackendConnected(true);
        setStats(statsRes.value.data);
        setLastSyncedAt(new Date());
        if (isManual) {
          const blockchainStatus = statsRes.value.data?.system?.health?.blockchain;
          if (blockchainStatus === "ONLINE") {
            toast.success("Sinkronisasi Realtime Berhasil: Semua Service & Blockchain ONLINE!");
          } else {
            toast.info("Status tersinkronisasi. Blockchain: " + (blockchainStatus || "OFFLINE"));
          }
        }
      } else {
        // Backend request failed (e.g. Tunnel closed or backend server offline)
        setIsBackendConnected(false);
        setLastSyncedAt(new Date());
        if (isManual) {
          toast.error("Gagal terhubung ke Backend / Tunnel. Pastikan Backend & Ngrok menyala!");
        }
      }

      if (discRes.status === "fulfilled" && discRes.value?.data?.ok) {
        setDiscrepancies(discRes.value.data.data || []);
      } else {
        setDiscrepancies([]);
      }

      if (reqRes.status === "fulfilled" && reqRes.value?.data?.ok) {
        setCorrectionRequests(reqRes.value.data.data || []);
      } else {
        setCorrectionRequests([]);
      }

      if (syncStatsRes.status === "fulfilled" && syncStatsRes.value?.data?.ok) {
        setSyncStats(syncStatsRes.value.data.data);
      }
    } catch (err: any) {
      console.error("[Dashboard] Failed to fetch stats:", err);
      setIsBackendConnected(false);
      if (isManual) {
        toast.error("Gagal menyinkronkan status service dari backend");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsSyncing(false);
      }
    }
  }, []);

  // Initial fetch and Realtime Auto-Sync Interval (Every 4 seconds)
  useEffect(() => {
    isMountedRef.current = true;
    fetchStats(false);

    // Live Auto-Sync Polling Interval
    const syncInterval = setInterval(() => {
      if (autoSync) {
        fetchStats(false);
      }
    }, 4000);

    // Live Ticking Clock
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(syncInterval);
      clearInterval(clockTimer);
    };
  }, [fetchStats, autoSync]);

  const handleManualLedgerSync = async () => {
    setIsSyncingLedger(true);
    try {
      const res = await api.post("/certificates/sync-ledger");
      if (res.data.ok) {
        toast.success(res.data.message || "Sinkronisasi antrean ke Blockchain berhasil!");
        fetchStats(false);
      }
    } catch (err: any) {
      console.error("Manual Ledger Sync Error:", err);
      toast.error(err.response?.data?.error || "Gagal menyinkronkan antrean ke Blockchain");
    } finally {
      setIsSyncingLedger(false);
    }
  };

  const openSupersedeModal = (item: any) => {
    setSelectedDiscrepancy(item);
    const cert = item.certificate;
    const req = item.pendingRequest;
    const user = item.currentUser;

    setCorrectedName(req?.requestedName || user?.name || cert.studentName);
    setCorrectedProgram(req?.requestedProgram || user?.studyProgram || cert.program);
    setCorrectedMajority(req?.requestedMajority || user?.majority || cert.majority);
    setSupersedeReason(req?.reason || "Koreksi data profil dan ejaan nama pada sertifikat");
    setUpdateUserProfile(true);
    setShowSupersedeModal(true);
  };

  const handleSupersedeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscrepancy || !supersedeReason.trim()) {
      toast.error("Mohon isi alasan koreksi & penerbitan ulang.");
      return;
    }

    setSubmittingSupersede(true);
    try {
      const res = await api.post("/certificates/supersede", {
        oldCertId: selectedDiscrepancy.certificate.certId || selectedDiscrepancy.certificate.id,
        correctedName: correctedName.trim(),
        correctedProgram: correctedProgram.trim(),
        correctedMajority: correctedMajority.trim(),
        reason: supersedeReason.trim(),
        requestId: selectedDiscrepancy.pendingRequest?.id || null,
        updateUserProfile: updateUserProfile,
      });

      if (res.data.ok) {
        toast.success("Sertifikat berhasil digantikan (Superseded) dan diterbitkan ulang di Blockchain!");
        setShowSupersedeModal(false);
        fetchStats(false);
      }
    } catch (err: any) {
      console.error("Failed to supersede certificate:", err);
      toast.error(err.response?.data?.error || "Gagal melakukan supersede sertifikat");
    } finally {
      setSubmittingSupersede(false);
    }
  };

  if (loading && !stats && isBackendConnected) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-cyan-400 font-mono">
        <RefreshCw size={32} className="animate-spin text-neon-blue" />
        <div className="animate-pulse tracking-widest text-sm uppercase">
          &gt; INITIALIZING_REALTIME_SYSTEM_MONITOR...
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Active_Users",
      value: isBackendConnected ? stats?.stats?.totalUsers || 0 : "--",
      icon: Users,
    },
    {
      title: "Pending_Auth",
      value: isBackendConnected ? stats?.stats?.pendingTeachers || 0 : "--",
      icon: UserCheck,
    },
    {
      title: "Issued_Certs",
      value: isBackendConnected ? stats?.stats?.totalCertificates || 0 : "--",
      icon: FileText,
    },
    {
      title: "Deployments",
      value: isBackendConnected ? stats?.stats?.totalCourses || 0 : "--",
      icon: BookOpen,
    },
  ];

  // Professional service monitoring mapping with dynamic health check
  const isFabricOnline = stats?.system?.health?.blockchain === "ONLINE";

  const services = [
    {
      name: "Frontend UI Client",
      status: "ONLINE",
      desc: "Next.js Web Host (Vercel Edge)",
      icon: Layers,
      color: "text-cyan-400",
    },
    {
      name: "Backend API Server",
      status: isBackendConnected && stats?.system?.health?.backend === "ONLINE" ? "ONLINE" : "OFFLINE",
      desc: isBackendConnected
        ? `Express Gateway (Uptime: ${stats?.system?.uptime || 0}s)`
        : "Tunnel Mati / Backend Disconnected",
      icon: Server,
      color: isBackendConnected ? "text-emerald-400" : "text-rose-400",
    },
    {
      name: "Database (PostgreSQL / Supabase)",
      status: isBackendConnected ? (stats?.system?.health?.database || "OFFLINE") : "OFFLINE",
      desc: isBackendConnected
        ? `Cloud Mirror Ledger (Port: ${stats?.system?.dbPort || 5432})`
        : "Unreachable (Backend Offline)",
      icon: Database,
      color: isBackendConnected && stats?.system?.health?.database === "ONLINE" ? "text-blue-400" : "text-rose-400",
    },
    {
      name: "IPFS Storage (Pinata / Kubo)",
      status: isBackendConnected ? (stats?.system?.health?.ipfs || "OFFLINE") : "OFFLINE",
      desc: isBackendConnected ? "Decentralized File Storage (Cloud)" : "Unreachable (Backend Offline)",
      icon: HardDrive,
      color: isBackendConnected && stats?.system?.health?.ipfs === "ONLINE" ? "text-purple-400" : "text-rose-400",
    },
    {
      name: "Blockchain (Hyperledger Fabric)",
      status: isBackendConnected ? (isFabricOnline ? "ONLINE" : "OFFLINE") : "OFFLINE",
      desc: isBackendConnected
        ? (isFabricOnline ? "Consensus Ledger (Channel: mychannel)" : "Mirror Queue Mode (Sync on Connect)")
        : "Unreachable (Backend Offline)",
      icon: Cpu,
      color: isBackendConnected && isFabricOnline ? "text-neon-pink" : "text-rose-400",
    },
  ];

  const allOnline = isBackendConnected && services.every((s) => s.status === "ONLINE");
  const totalIssues = discrepancies.length + correctionRequests.length;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 font-sans">
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Administrative <span className="text-neon-purple">Overview</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider bg-white/5 border border-white/10 text-cyan-300">
              <Radio
                size={12}
                className={autoSync ? "text-emerald-400 animate-pulse" : "text-slate-400"}
              />
              {autoSync ? "REALTIME SYNC (4s)" : "SYNC PAUSED"}
            </span>

            {!isBackendConnected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse">
                <WifiOff size={12} />
                BACKEND DISCONNECTED
              </span>
            )}

            {isBackendConnected && totalIssues > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse">
                <AlertTriangle size={12} />
                {totalIssues} DATA REVIEW
              </span>
            )}
          </div>

          <div className="text-white/40 text-[11px] font-semibold tracking-widest mt-3 flex flex-wrap items-center gap-4 uppercase font-mono">
            <p className="flex items-center gap-2">
              <Clock size={12} className="text-neon-soft-blue" />
              <span className="text-neon-soft-blue">Server Time:</span>{" "}
              {currentTime.toLocaleTimeString()}
            </p>
            <span className="opacity-20">|</span>
            <p className="flex items-center gap-2">
              <span className="text-neon-blue">Timezone:</span>{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
            {lastSyncedAt && (
              <>
                <span className="opacity-20">|</span>
                <p className={isBackendConnected ? "text-white/50" : "text-rose-400/80 font-bold"}>
                  Last Sync: {lastSyncedAt.toLocaleTimeString()} {isBackendConnected ? "" : "(Failed)"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Sync Controls & Stability Mode Card */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoSync(!autoSync)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 ${
              autoSync
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}
            title={autoSync ? "Jeda sinkronisasi otomatis" : "Aktifkan sinkronisasi otomatis tiap 4 detik"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoSync ? "bg-emerald-400 animate-ping" : "bg-white/30"
              }`}
            />
            <span>{autoSync ? "Auto-Sync: Aktif" : "Auto-Sync: Jeda"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-gradient-to-r from-neon-blue to-cyan-500 hover:opacity-95 text-slate-950 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            title="Perbarui status seluruh service dan blockchain sekarang"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Menyinkronkan..." : "Sync Realtime"}</span>
          </button>

          <div className="px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md shadow-xl hidden sm:flex flex-col justify-center">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              Ledger State
            </p>
            <p className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  allOnline ? "bg-emerald-400 animate-pulse" : isFabricOnline ? "bg-amber-400 animate-pulse" : "bg-cyan-400 animate-pulse"
                }`}
              />
              {allOnline ? "All Systems Operational" : isFabricOnline ? "Partial Online" : "Mirror Cloud Mode Active"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card, idx) => {
          const galaxyColors = [
            "text-neon-purple border-neon-purple/20 bg-neon-purple/5",
            "text-neon-blue border-neon-blue/20 bg-neon-blue/5",
            "text-neon-pink border-neon-pink/20 bg-neon-pink/5",
            "text-neon-soft-blue border-neon-soft-blue/20 bg-neon-soft-blue/5",
          ];

          return (
            <div
              key={idx}
              className={`group relative p-8 rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                galaxyColors[idx % 4]
              } backdrop-blur-xl overflow-hidden`}
            >
              <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-all duration-700">
                <card.icon size={110} />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-5 group-hover:text-white/60 transition-colors">
                  {card.title.replace("_", " ")}
                </p>
                <div className="flex items-end justify-between">
                  <h3 className="text-5xl font-bold tracking-tight text-white">
                    {card.value}
                  </h3>
                  <card.icon
                    size={28}
                    className="opacity-20 group-hover:opacity-100 transition-opacity text-white"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HYBRID CLOUD MIRROR LEDGER & SYNC QUEUE WIDGET */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.02] shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <GitMerge size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2.5">
                Blockchain Mirror Ledger & Catchup Queue
                {syncStats.pendingCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold animate-pulse">
                    {syncStats.pendingCount} Pending Sync
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                    Ledger Fully Synced
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sertifikat yang diterbitkan saat node offline otomatis dicatat ke Mirror Ledger dan dapat disinkronkan ke konsensus Blockchain kapan saja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualLedgerSync}
              disabled={isSyncingLedger || !isBackendConnected || !isFabricOnline || syncStats.pendingCount === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                isFabricOnline && syncStats.pendingCount > 0
                  ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-cyan-500/20 animate-pulse hover:opacity-90"
                  : "bg-white/5 border border-white/10 text-white/60"
              }`}
              title={
                !isFabricOnline
                  ? "Hubungkan node Hyperledger Fabric untuk menyinkronkan antrean"
                  : syncStats.pendingCount === 0
                  ? "Tidak ada antrean tertunda"
                  : "Sinkronkan seluruh sertifikat tertunda ke Hyperledger Fabric"
              }
            >
              {isSyncingLedger ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              <span>{isSyncingLedger ? "Menyinkronkan..." : "Sinkronkan Antrean ke Blockchain"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Tersinkronisasi Konsensus:</span>
            <span className="text-emerald-400 font-bold text-sm">{syncStats.syncedCount} Certs</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Antrean Pending Sync:</span>
            <span className={syncStats.pendingCount > 0 ? "text-amber-400 font-bold text-sm" : "text-slate-400 font-bold text-sm"}>
              {syncStats.pendingCount} Certs
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400">Node Blockchain Peer:</span>
            <span className={isFabricOnline ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {isFabricOnline ? "CONNECTED (Ready)" : "DISCONNECTED (Queueing)"}
            </span>
          </div>
        </div>
      </div>

      {/* DATA DRIFT & CORRECTION REQUESTS SECTION */}
      {discrepancies.length > 0 && (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border-amber-500/20 bg-amber-500/[0.02] shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Deteksi Ketidaksesuaian Data & Permohonan Koreksi
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                    {discrepancies.length} Perlu Review
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sistem otomatis mendeteksi perubahan profil akun atau tiket permohonan koreksi nama dari mahasiswa.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {discrepancies.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {item.certificate?.course?.title || "Sertifikat"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      ID: {item.certificate?.certId?.substring(0, 16)}...
                    </span>
                    {item.hasPendingCorrection && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        Tiket Mahasiswa Masuk
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      Nama di Sertifikat: <strong className="text-rose-300 line-through">{item.certificate?.studentName}</strong>
                    </span>
                    <ArrowRight size={12} className="text-slate-500" />
                    <span className="text-emerald-400">
                      Nama Terkini: <strong>{item.pendingRequest?.requestedName || item.currentUser?.name || "N/A"}</strong>
                    </span>
                  </div>

                  {item.diffs && item.diffs.length > 0 && (
                    <div className="text-[11px] text-amber-300/80 font-mono">
                      &bull; {item.diffs.join(" | ")}
                    </div>
                  )}

                  {item.pendingRequest?.reason && (
                    <div className="text-xs text-slate-400 italic">
                      Alasan: &ldquo;{item.pendingRequest.reason}&rdquo;
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openSupersedeModal(item)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Edit3 size={14} />
                    <span>Koreksi & Re-Issue</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Activity Ledger */}
        <div className="lg:col-span-2 glass-panel p-8 sm:p-10 rounded-3xl border-transparent shadow-2xl">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <h3 className="font-bold text-white flex items-center gap-3 text-xs uppercase tracking-widest">
              <Activity size={18} className="text-neon-purple" />
              Recent Activity Ledger
            </h3>
            <span className="text-[10px] font-mono text-white/40">
              {stats?.recentActivity?.length || 0} Terkini
            </span>
          </div>

          <div className="space-y-4">
            {(!isBackendConnected || !stats?.recentActivity || stats?.recentActivity?.length === 0) ? (
              <div className="text-white/20 text-xs font-semibold py-24 text-center italic border border-white/5 bg-white/[0.01] rounded-3xl">
                {!isBackendConnected
                  ? "Backend is currently unreachable. Connect backend to view ledger activity."
                  : "No recent activity recorded in the registry."}
              </div>
            ) : (
              stats?.recentActivity?.map((act: any) => (
                <div
                  key={act.id}
                  className="group flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-neon-blue border border-white/10 group-hover:bg-neon-blue group-hover:text-black transition-all shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight group-hover:text-neon-blue transition-colors">
                        {act.studentName || "Resource Verification Entry"}
                      </p>
                      <p className="text-[11px] font-semibold text-white/40 mt-0.5 uppercase tracking-widest font-mono">
                        Hash: {act.hash?.substring(0, 18).toUpperCase() || "N/A"}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                      {new Date(
                        act.createdAt || act.issuedAt || Date.now()
                      ).toLocaleTimeString()}
                    </span>
                    <span className="text-[9px] font-bold text-neon-purple uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Confirmed Entry
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Health Check & System Services Monitoring */}
        <div className="space-y-8">
          {/* Health Check Monitor */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-transparent shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-5">
              <div className="flex items-center gap-3">
                <ActivitySquare size={18} className="text-neon-blue" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                  Service Status
                </h3>
              </div>
              <span
                className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  allOnline
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : isFabricOnline
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    allOnline ? "bg-emerald-400" : isFabricOnline ? "bg-amber-400" : "bg-cyan-400"
                  }`}
                />
                {allOnline ? "HEALTHY (CONSENSUS)" : isFabricOnline ? "ONLINE (PARTIAL)" : "MIRROR CLOUD MODE"}
              </span>
            </div>

            <div className="space-y-3.5">
              {services.map((srv, idx) => {
                const isOnline = srv.status === "ONLINE";
                const IconComponent = srv.icon || Server;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      isOnline
                        ? "bg-white/[0.015] border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]"
                        : "bg-rose-500/[0.03] border-rose-500/20 hover:bg-rose-500/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isOnline
                            ? "bg-white/5 border-white/10 " + srv.color
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}
                      >
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                          {srv.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {srv.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold font-mono tracking-wider px-2.5 py-1 rounded-lg border transition-all ${
                          isOnline
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            : "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                        }`}
                      >
                        {srv.status}
                      </span>
                      {isOnline ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <XCircle size={16} className="text-rose-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-cyan-400" />
                Hyperledger Fabric v2.5 Peer
              </span>
              <span className="text-cyan-400/80">Org1MSP · TLS</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SUPERSEDE & RE-ISSUE */}
      {showSupersedeModal && selectedDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#111116] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Koreksi & Terbitkan Ulang Sertifikat (Supersede)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sertifikat lama akan dicabut (SUPERSEDED) dan sertifikat baru diterbitkan ke Blockchain / Mirror Ledger.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupersedeModal(false)}
                className="text-white/40 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSupersedeSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs space-y-1.5">
                <div className="text-slate-400">
                  ID Sertifikat Asli: <code className="text-amber-300 font-mono">{selectedDiscrepancy.certificate.certId}</code>
                </div>
                <div className="text-slate-400">
                  Nama Awal di Sertifikat: <strong className="text-rose-300">{selectedDiscrepancy.certificate.studentName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ejaan Nama Lengkap yang Baru / Sah
                </label>
                <input
                  type="text"
                  required
                  value={correctedName}
                  onChange={(e) => setCorrectedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Program Studi
                  </label>
                  <input
                    type="text"
                    value={correctedProgram}
                    onChange={(e) => setCorrectedProgram(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Bidang Keahlian
                  </label>
                  <input
                    type="text"
                    value={correctedMajority}
                    onChange={(e) => setCorrectedMajority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Alasan Pembaruan / Koreksi (Tercatat di Blockchain)
                </label>
                <textarea
                  required
                  rows={2}
                  value={supersedeReason}
                  onChange={(e) => setSupersedeReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Koreksi ejaan nama sesuai KTP / ijazah"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="updateProfile"
                  checked={updateUserProfile}
                  onChange={(e) => setUpdateUserProfile(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="updateProfile" className="text-xs text-slate-300">
                  Perbarui juga data profil user di database secara bersamaan
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowSupersedeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSupersede}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {submittingSupersede ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>{submittingSupersede ? "Memproses..." : "Terbitkan Ulang Sekarang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
