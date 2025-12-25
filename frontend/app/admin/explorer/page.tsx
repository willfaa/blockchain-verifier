"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity, Box, Hash, Layers, Server, RefreshCw } from "lucide-react";

export default function ExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/explorer/stats");
      if (res.data.ok) {
        setStats(res.data.data);
      } else {
        setError(res.data.error || "Failed to fetch stats");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network Error: Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Blockchain Explorer
          </h1>
          <p className="text-slate-400">
            Real-time visualization of the Hyperledger Fabric Network
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#0E0E1E] border border-teal-900/30 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Box size={64} className="text-teal-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Block Height
          </p>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-white">
              {stats?.chainInfo?.height?.low || "-"}
            </span>
            <span className="text-teal-500 text-xs px-2 py-0.5 bg-teal-950 rounded-full border border-teal-800">
              LIVE
            </span>
          </div>
        </div>

        <div className="p-6 bg-[#0E0E1E] border border-teal-900/30 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers size={64} className="text-purple-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Total Assets
          </p>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-black text-white">
              {stats?.totalAssets || 0}
            </span>
            <span className="text-xs text-slate-400 mt-2">Certificates</span>
          </div>
        </div>

        <div className="p-6 bg-[#0E0E1E] border border-teal-900/30 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server size={64} className="text-blue-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
            Network Status
          </p>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xl font-bold text-emerald-400">Active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">channel: mychannel</p>
        </div>
      </div>

      {/* LATEST HASH INFO */}
      <div className="p-6 bg-[#0E0E1E] border border-teal-900/30 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Hash size={20} className="text-teal-500" />
          Current Network State
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
          <div className="bg-black/30 p-3 rounded border border-white/5">
            <span className="block text-slate-500 text-xs mb-1">
              Current Block Hash
            </span>
            <span className="text-teal-300 break-all">
              {stats?.chainInfo?.currentBlockHash?.data
                ? Buffer.from(stats.chainInfo.currentBlockHash.data).toString(
                    "hex"
                  )
                : "Loading..."}
            </span>
          </div>
          <div className="bg-black/30 p-3 rounded border border-white/5">
            <span className="block text-slate-500 text-xs mb-1">
              Previous Block Hash
            </span>
            <span className="text-purple-300 break-all">
              {stats?.chainInfo?.previousBlockHash?.data
                ? Buffer.from(stats.chainInfo.previousBlockHash.data).toString(
                    "hex"
                  )
                : "Loading..."}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE LEDGER TABLE */}
      <div className="bg-[#0E0E1E] border border-teal-900/30 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-teal-900/30 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-teal-500" />
            Live Asset Ledger
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Source: System Chaincode (QSCC) & World State
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-black/20 text-slate-200 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Course</th>
                <th className="p-4">Status</th>
                <th className="p-4">Issued Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.ledger?.length > 0 ? (
                stats.ledger.map((cert: any) => (
                  <tr
                    key={cert.cert_id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-mono text-teal-400">
                      {cert.cert_id}
                    </td>
                    <td className="p-4 font-medium text-white">{cert.name}</td>
                    <td className="p-4">{cert.program}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                          cert.status === "ISSUED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{cert.issued_at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 italic"
                  >
                    {loading
                      ? "Syncing with ledger..."
                      : "No assets found on blockchain."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
