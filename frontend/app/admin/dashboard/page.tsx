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
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isMountedRef = useRef(true);

  // Fetch stats from backend
  const fetchStats = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const res = await api.get("/admin/stats");
      if (res.data) {
        setStats(res.data);
        setLastSyncedAt(new Date());
        if (isManual) {
          const blockchainStatus = res.data?.system?.health?.blockchain;
          if (blockchainStatus === "ONLINE") {
            toast.success("Sinkronisasi Realtime Berhasil: Semua Service & Blockchain ONLINE!");
          } else {
            toast.info("Status tersinkronisasi. Blockchain: " + (blockchainStatus || "OFFLINE"));
          }
        }
      }
    } catch (err: any) {
      console.error("[Dashboard] Failed to fetch stats:", err);
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

  if (loading && !stats) {
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
      value: stats?.stats?.totalUsers || 0,
      icon: Users,
    },
    {
      title: "Pending_Auth",
      value: stats?.stats?.pendingTeachers || 0,
      icon: UserCheck,
    },
    {
      title: "Issued_Certs",
      value: stats?.stats?.totalCertificates || 0,
      icon: FileText,
    },
    {
      title: "Deployments",
      value: stats?.stats?.totalCourses || 0,
      icon: BookOpen,
    },
  ];

  // Professional service monitoring mapping with dynamic health check
  const services = [
    {
      name: "Frontend UI Client",
      status: "ONLINE",
      desc: "Next.js Web Host",
      icon: Layers,
      color: "text-cyan-400",
    },
    {
      name: "Backend API Server",
      status: stats?.system?.health?.backend || "ONLINE",
      desc: `Express Gateway (Uptime: ${stats?.system?.uptime || 0}s)`,
      icon: Server,
      color: "text-emerald-400",
    },
    {
      name: "Database (PostgreSQL / Supabase)",
      status: stats?.system?.health?.database || "OFFLINE",
      desc: `Relational Registry (Port: ${stats?.system?.dbPort || 5433})`,
      icon: Database,
      color: "text-blue-400",
    },
    {
      name: "IPFS Storage (Pinata / Kubo)",
      status: stats?.system?.health?.ipfs || "OFFLINE",
      desc: "Decentralized File Storage",
      icon: HardDrive,
      color: "text-purple-400",
    },
    {
      name: "Blockchain (Hyperledger Fabric)",
      status: stats?.system?.health?.blockchain || "OFFLINE",
      desc: "Consensus Ledger (Channel: mychannel)",
      icon: Cpu,
      color: "text-neon-pink",
    },
  ];

  const allOnline = services.every((s) => s.status === "ONLINE");

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
                <p className="text-white/50">
                  Last Sync: {lastSyncedAt.toLocaleTimeString()}
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
                  allOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"
                }`}
              />
              {allOnline ? "All Systems Operational" : "Degraded / Partial"}
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
            {stats?.recentActivity?.length === 0 ? (
              <div className="text-white/20 text-xs font-semibold py-24 text-center italic border border-white/5 bg-white/[0.01] rounded-3xl">
                No recent activity recorded in the registry.
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
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    allOnline ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {allOnline ? "HEALTHY" : "CHECK REQUIRED"}
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
                            : "text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse"
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
    </div>
  );
}
