"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Users,
  FileText,
  BookOpen,
  UserCheck,
  Activity,
  ActivitySquare,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [updatingLayout, setUpdatingLayout] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1. Fetch Stats & Settings
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/settings")
    ])
      .then(([statsRes, settingsRes]) => {
        setStats(statsRes.data);
        if (settingsRes.data.ok && settingsRes.data.settings) {
          setLayout(settingsRes.data.settings.certificateLayout);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // 2. Ticking Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLayoutChange = async (newLayout: "HORIZONTAL" | "VERTICAL") => {
    setUpdatingLayout(true);
    try {
      const res = await api.post("/admin/settings", { certificateLayout: newLayout });
      if (res.data.ok) {
        setLayout(newLayout);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingLayout(false);
    }
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

  // Services list for professional service monitoring
  const services = [
    {
      name: "Frontend UI Client",
      status: "ONLINE",
      desc: "Static Web Host",
    },
    {
      name: "Backend API Server",
      status: "ONLINE",
      desc: "Express Gateway",
    },
    {
      name: "Database (Supabase)",
      status: stats?.system?.health?.database || "OFFLINE",
      desc: "Cloud Registry",
    },
    {
      name: "IPFS Kubo Gateway",
      status: stats?.system?.health?.ipfs || "OFFLINE",
      desc: "Decentralized Files",
    },
    {
      name: "Blockchain (Hyperledger Fabric)",
      status: stats?.system?.health?.blockchain || "OFFLINE",
      desc: "Consensus Ledger",
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-white/5 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Administrative <span className="text-neon-purple">Overview</span>
          </h1>
          <div className="text-white/40 text-[11px] font-semibold tracking-widest mt-4 space-y-1 uppercase">
            <p className="flex items-center gap-4">
              <span className="text-neon-soft-blue">Server Time:</span>{" "}
              {currentTime.toLocaleTimeString()}
              <span className="opacity-20">|</span>
              <span className="text-neon-blue">Timezone:</span>{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
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
              Secure Ledger V1
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
                  <h3 className={`text-5xl font-bold tracking-tight text-white`}>
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

        {/* Right: Health Check & System Settings */}
        <div className="space-y-8">
          
          {/* Health Check Monitor */}
          <div className="glass-panel p-8 rounded-3xl border-transparent shadow-2xl">
            <div className="flex items-center mb-8 gap-4 border-b border-white/5 pb-6">
              <ActivitySquare size={20} className="text-neon-blue" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                Service Status
              </h3>
            </div>
            
            <div className="space-y-4">
              {services.map((srv, idx) => {
                const isOnline = srv.status === "ONLINE";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        {srv.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {srv.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          isOnline
                            ? "text-teal-400 bg-teal-500/10 border border-teal-500/20"
                            : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                        }`}
                      >
                        {srv.status}
                      </span>
                      {isOnline ? (
                        <CheckCircle2 size={14} className="text-teal-400" />
                      ) : (
                        <XCircle size={14} className="text-rose-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate Orientation Switch */}
          <div className="glass-panel p-8 rounded-3xl border-transparent shadow-2xl">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <FileText size={20} className="text-neon-pink" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                Print Orientation
              </h3>
            </div>
            <div className="space-y-4 mt-6">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Global Certificate Layout (A4)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={updatingLayout}
                  onClick={() => handleLayoutChange("HORIZONTAL")}
                  className={`py-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    layout === "HORIZONTAL"
                      ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  Horizontal
                </button>
                <button
                  disabled={updatingLayout}
                  onClick={() => handleLayoutChange("VERTICAL")}
                  className={`py-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    layout === "VERTICAL"
                      ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  Vertical
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
