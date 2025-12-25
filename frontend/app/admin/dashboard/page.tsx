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

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-mono">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase border-l-4 border-teal-500 pl-4">
          Status_Report
        </h1>
        <p className="text-teal-400/60 text-xs pl-5">
          SYSTEM_TIME: {new Date().toISOString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-none border-l-2 ${card.border} ${card.bg} backdrop-blur relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <card.icon size={64} className={card.color} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                {card.title}
              </p>
              <h3 className={`text-4xl font-bold ${card.color}`}>
                {card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#050510] border border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-teal-900/30 pb-4">
            <h3 className="font-bold text-teal-100 flex items-center gap-2 text-sm uppercase">
              <Activity size={16} className="text-teal-500" />
              Latest_Transactions
            </h3>
          </div>

          <div className="space-y-2">
            {stats?.recentActivity?.length === 0 ? (
              <div className="text-slate-600 text-sm py-10 text-center font-mono">
                [NULL] No recent activity found.
              </div>
            ) : (
              stats?.recentActivity?.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 bg-teal-900/5 border-l-2 border-transparent hover:border-teal-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-teal-900/20 text-teal-400">
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-teal-200">
                        Mint_Success
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {act.hash?.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-teal-600">
                    {new Date(act.issuedAt).toISOString().split("T")[0]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#050510] border border-teal-900/30 p-6">
          <div className="flex items-center mb-6 gap-2 border-b border-teal-900/30 pb-4">
            <BarChart3 size={16} className="text-teal-500" />
            <h3 className="font-bold text-teal-100 text-sm uppercase">
              Kernel_Log
            </h3>
          </div>
          <div className="text-[10px] text-slate-500 space-y-2 font-mono">
            <p>
              <span className="text-green-500">[OK]</span> Connection
              established to 127.0.0.1:5432
            </p>
            <p>
              <span className="text-green-500">[OK]</span> Hyperledger Fabric
              gateway synced
            </p>
            <p>
              <span className="text-blue-500">[INFO]</span> Admin session
              initialized
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UID:{" "}
              {Math.floor(Math.random() * 9999)}
            </p>
            {stats?.stats?.pendingTeachers > 0 && (
              <p className="text-orange-500">
                <span className="animate-pulse">[WARN]</span> Pending
                Authorization: {stats?.stats?.pendingTeachers} user(s)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
