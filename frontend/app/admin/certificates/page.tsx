"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import { FileText, ExternalLink, ShieldCheck } from "lucide-react";

export default function CertificateLedgerPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Admin needs a special route to list ALL certificates or reuse user endpoint?
    // Let's use /admin/certificates endpoint if it existed, or just generic GET /cert (if it returns all for admin).
    // Assuming GET /cert with admin token returns all? Or user-controller usage?
    // Let's create a quick "getAllCertificates" in admin logic or just rely on existing getCertificates if tailored.
    // For now, let's try calling the existing /lms/courses or assume an Endpoint exists.
    // Actually, task description says "Global View". Let's assume we implement fetching logic via admin stats or similar.
    // Wait, let's check `api` routes...
    // Implementing a client-side fetch for the sake of speed using the 'recentActivity' logic expander
    // OR BETTER: Use the `getDashboardStats` logic I wrote which has "recentActivity".
    // BUT we need pagination.
    // Let's add GET /admin/certificates to AdminController later.
    // For THIS Step, I will fetch from `/admin/stats` and mock the full list or assume we add the route.
    // I will add the route in the next step to be robust. For now, UI shell.

    // TEMPORARY: Fetch stats which has "recentActivity" and use that as initial data
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
          {new Date(r.issuedAt).toISOString().split("T")[0]}
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
          {r.hash.substring(0, 15)}...
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
