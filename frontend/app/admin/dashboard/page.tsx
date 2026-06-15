"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Users,
  FileText,
  BookOpen,
  UserCheck,
  Activity,
  BarChart3,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [sessionStart] = useState(Date.now());

  useEffect(() => {
    // 1. Fetch Stats
    api
      .get("/admin/stats")
      .then((res) => {
        setStats(res.data);
        setFetchedAt(Date.now());
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // 2. Ticking Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate live uptime based on server snapshot + elapsed local time
  const liveUptime = stats?.system?.uptime
    ? stats.system.uptime + Math.floor((Date.now() - fetchedAt) / 1000)
    : 0;

  const sessionUptime = Math.floor(
    (currentTime.getTime() - sessionStart) / 1000
  );

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    parts.push(`${h.toString().padStart(2, "0")}h`);
    parts.push(`${m.toString().padStart(2, "0")}m`);
    parts.push(`${s.toString().padStart(2, "0")}s`);
    return parts.join(" ");
  };

  if (loading)
    return (
      <div className="text-teal-500 animate-pulse font-mono flex items-center gap-2">
        <span>&gt;</span> INITIALIZING_SYSTEM_MONITOR...
      </div>
    );

  const cards = [
    {
      title: "Active_Users",
      value: stats?.stats?.totalUsers || 0,
      icon: Users,
      color: "text-teal-400",
      border: "border-teal-500/20",
      bg: "bg-teal-500/5",
    },
    {
      title: "Pending_Auth",
      value: stats?.stats?.pendingTeachers || 0,
      icon: UserCheck,
      color: "text-orange-400",
      border: "border-orange-500/20",
      bg: "bg-orange-500/5",
    },
    {
      title: "Issued_Certs",
      value: stats?.stats?.totalCertificates || 0,
      icon: FileText,
      color: "text-cyan-400",
      border: "border-cyan-500/20",
      bg: "bg-cyan-500/5",
    },
    {
      title: "Deployments",
      value: stats?.stats?.totalCourses || 0,
      icon: BookOpen,
      color: "text-purple-400",
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-white/5 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Administrative <span className="text-neon-purple">Overview</span>
          </h1>
          <div className="text-white/40 text-[11px] font-semibold tracking-widest mt-4 space-y-2 uppercase">
            <p className="flex items-center gap-4">
              <span className="text-neon-soft-blue">Server Time:</span>{" "}
              {currentTime.toLocaleTimeString()}
              <span className="opacity-20">|</span>
              <span className="text-neon-blue">Region:</span>{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
            <p className="flex items-center gap-4">
              <span className="text-neon-purple">System Uptime:</span>{" "}
              {formatUptime(liveUptime)}
              <span className="opacity-20">|</span>
              <span className="text-neon-pink">Session Trace:</span>{" "}
              {formatUptime(sessionUptime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
              Stability Mode
            </p>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></span>
              Production Stable
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
                  <h3 className={`text-5xl font-bold tracking-tight`}>
                    {card.value}
                  </h3>
                  <card.icon
                    size={28}
                    className="opacity-20 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-10 rounded-3xl border-transparent shadow-2xl">
          <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8">
            <h3 className="font-bold text-white flex items-center gap-4 text-xs uppercase tracking-widest">
              <Activity size={20} className="text-neon-purple" />
              Recent Activity Ledger
            </h3>
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
                  className="group flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 text-neon-blue border border-white/10 group-hover:bg-neon-blue group-hover:text-black transition-all">
                      <FileText size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight group-hover:text-neon-blue transition-colors">
                        Resource Verification Success
                      </p>
                      <p className="text-[11px] font-semibold text-white/30 mt-1 uppercase tracking-widest">
                        Reference: {act.hash?.substring(0, 20).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
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

        <div className="glass-panel p-10 rounded-3xl border-transparent shadow-2xl">
          <div className="flex items-center mb-10 gap-4 border-b border-white/5 pb-8">
            <BarChart3 size={20} className="text-neon-blue" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              System Environment
            </h3>
          </div>
          <div className="text-[11px] font-semibold text-white/40 space-y-5 tracking-wide">
            <p className="flex justify-between items-center group">
              <span className="group-hover:text-white/80 transition-colors">
                Registry Node:
              </span>
              <span className="text-white font-mono">
                {stats?.system?.dbPort || "5432"}
              </span>
            </p>
            <p className="flex justify-between items-center group">
              <span className="group-hover:text-white/80 transition-colors">
                Interface Service:
              </span>
              <span className="text-white font-mono">
                {stats?.system?.ipfsApi?.split("//")[1] || "127.0.0.1:5001"}
              </span>
            </p>
            <p className="flex justify-between items-center group border-b border-white/5 pb-6">
              <span className="group-hover:text-white/80 transition-colors">
                Gateway Anchor:
              </span>
              <span className="text-white font-mono">
                {stats?.system?.ipfsGateway?.split("//")[1] || "127.0.0.1:8081"}
              </span>
            </p>

            <div className="pt-2">
              {stats?.system?.fabricEnabled ? (
                <div className="p-5 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl text-neon-blue flex items-center justify-between shadow-inner">
                  <span className="font-bold">Protocol Active</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-neon-blue animate-pulse"></div>
                </div>
              ) : (
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl text-white/30 flex items-center justify-between">
                  <span className="font-bold">Offline Buffer</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-white/5 space-y-4">
              <p className="text-[10px] text-white/20 italic leading-relaxed">
                Architecture Instance: STABLE_V18
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-neon-purple w-4/5 animate-pulse shadow-[0_0_10px_#b026ff]"></div>
              </div>
            </div>

            {stats?.stats?.pendingTeachers > 0 && (
              <div className="mt-10 p-5 bg-neon-pink/10 border border-neon-pink/20 rounded-2xl shadow-xl">
                <p className="text-neon-pink font-bold text-center">
                  Notice: {stats?.stats?.pendingTeachers} Authorization Requests
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
