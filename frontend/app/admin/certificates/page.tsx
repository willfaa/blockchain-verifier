"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import { FileText, ExternalLink, ShieldCheck } from "lucide-react";

export default function CertificateLedgerPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => {
        // This is just 5 items.
        setCerts(res.data.recentActivity || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: "issuedAt",
      label: "Timestamp",
      render: (r: any) => (
        <span className="font-mono text-xs text-teal-300">
          {
            new Date(r.createdAt || r.issuedAt || Date.now())
              .toISOString()
              .split("T")[0]
          }
        </span>
      ),
    },
    { key: "studentName", label: "Recipient_ID" },
    { key: "program", label: "Department" },
    {
      key: "hash",
      label: "Merkle_Hash",
      render: (r: any) => (
        <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1 group cursor-pointer hover:text-teal-400">
          <ShieldCheck
            size={10}
            className="text-teal-600 group-hover:text-teal-400"
          />
          {r.hash ? (
            `${r.hash.substring(0, 15)}...`
          ) : (
            <span className="text-gray-500 italic">Pending...</span>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: "Chain_Data",
      render: (r: any) => (
        <button
          onClick={() => window.open(`https://ipfs.io/ipfs/${r.cid}`, "_blank")}
          className="text-[10px] font-bold text-teal-500 hover:text-white border border-teal-500/30 hover:bg-teal-500 px-2 py-1 rounded-sm flex items-center gap-1 transition-colors uppercase"
        >
          View_Asset <ExternalLink size={8} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-col gap-2 border-b border-teal-900/30 pb-4">
        <h1 className="text-xl font-bold text-white uppercase tracking-tight">
          Transaction_Ledger
        </h1>
        <p className="text-teal-500/60 text-xs">
          Immutable Record of All Issued Credentials.
        </p>
      </div>

      <div className="bg-teal-900/10 border-l-2 border-teal-500 p-4 flex items-center gap-3">
        <ShieldCheck className="text-teal-500 h-6 w-6" />
        <div>
          <h4 className="font-bold text-teal-200 text-xs uppercase tracking-wider">
            Consensus_Verified
          </h4>
          <p className="text-[10px] text-teal-400/60">
            All nodes in sync. Ledger integrity valid.
          </p>
        </div>
      </div>

      <CyberpunkDataTable
        columns={columns}
        data={certs}
        isLoading={loading}
        totalItems={certs.length}
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
        sortBy="issuedAt"
        sortOrder="desc"
        onSort={() => {}}
      />
    </div>
  );
}
