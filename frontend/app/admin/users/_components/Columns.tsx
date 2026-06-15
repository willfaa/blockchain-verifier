import {
  CheckCircle,
  Ban,
  Trash2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper for Duration (Last Seen)
const getLastSeen = (dateString: string) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHrs > 0) return `${diffHrs}h ago`;
  return "Just now";
};

interface ColumnHandlers {
  verifyUser: (id: string, isVerify: boolean) => void;
  banUser: (id: string, isBan: boolean) => void;
  onDeleteClick: (id: string) => void;
  onBanClick: (id: string) => void;
  onUnbanClick: (id: string) => void;
  approveUser: (id: string) => void;
}

export const getColumns = (activeTab: string, handlers: ColumnHandlers) => {
  const commonColumns = [
    {
      key: "name",
      label: "Account Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-teal-500/30">
            <AvatarImage
              src={
                row.avatar?.startsWith("http")
                  ? row.avatar
                  : `${
                      process.env.NEXT_PUBLIC_API_BASE ||
                      "http://localhost:4000"
                    }${row.avatar}`
              }
              alt={row.name}
            />
            <AvatarFallback className="bg-teal-900/50 text-teal-400 text-xs font-bold">
              {row.name ? row.name.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-teal-100 text-sm">{row.name}</p>
            <p className="text-[10px] text-teal-500/70">{row.email}</p>
          </div>
        </div>
      ),
    },
  ];

  if (activeTab === "student") {
    return [
      ...commonColumns,
      {
        key: "name",
        label: "Account Information",
        sortable: true,
        render: (row: any) => (
          <code className="text-teal-300 bg-teal-900/10 px-1 py-0.5 rounded text-[10px] border border-teal-500/20">
            {row.nim || "N/A"}
          </code>
        ),
      },
      {
        key: "studyProgram",
        label: "Study_Program",
        sortable: true,
        render: (row: any) => (
          <span className="text-slate-300 text-xs text-nowrap">
            {row.studyProgram || "-"}
          </span>
        ),
      },
      {
        key: "majority",
        label: "Majority",
        sortable: true,
        render: (row: any) => (
          <span className="text-slate-300 text-xs text-nowrap">
            {row.majority || "-"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row: any) => (
          <div className="flex flex-col">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                row.isActive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {row.isActive ? "ACTIVE" : "OFFLINE"}
            </span>
            <span className="text-[9px] text-slate-500 flex items-center gap-1">
              <Clock size={8} />{" "}
              {!row.isVerified
                ? "Awaiting Approval"
                : row.isActive
                ? "Online"
                : `Last seen: ${getLastSeen(row.updatedAt)}`}
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        label: "Action",
        render: (row: any) => (
          <div className="flex items-center gap-2">
            {!row.isVerified ? (
              <button
                onClick={() => handlers.verifyUser(row.id, true)}
                title="Authorize (Verify)"
                className="p-1.5 text-teal-400 border border-teal-500/50 rounded hover:bg-teal-500/20 transition-colors"
              >
                <CheckCircle size={14} />
              </button>
            ) : (
              <button
                onClick={() => handlers.verifyUser(row.id, false)}
                title="Restrict (Unverify)"
                className="p-1.5 text-orange-400 border border-orange-500/50 rounded hover:bg-orange-500/20 transition-colors"
              >
                <XCircle size={14} />
              </button>
            )}
            {row.isActive ? (
              <button
                onClick={() => handlers.onBanClick(row.id)}
                title="Restrict Access"
                className="p-1.5 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/10 transition-colors"
              >
                <Ban size={14} />
              </button>
            ) : (
              <button
                onClick={() => handlers.onUnbanClick(row.id)}
                title="Restore Access"
                className="p-1.5 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/10 transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              onClick={() => handlers.onDeleteClick(row.id)}
              title="Delete User"
              className="p-1.5 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ];
  } else if (activeTab === "teacher") {
    return [
      ...commonColumns,
      {
        key: "nip",
        label: "NIP",
        sortable: true,
        render: (row: any) => (
          <code className="text-teal-300 bg-teal-900/10 px-1 py-0.5 rounded text-[10px] border border-teal-500/20">
            {row.nip || "N/A"}
          </code>
        ),
      },
      {
        key: "majority",
        label: "Department / Homebase",
        sortable: true,
        render: (row: any) => (
          <span className="text-slate-300 text-xs">{row.majority || "-"}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row: any) => (
          <div className="flex flex-col">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                row.isActive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {row.isActive ? "ACTIVE" : "OFFLINE"}
            </span>
            <span className="text-[9px] text-slate-500 flex items-center gap-1">
              <Clock size={8} />{" "}
              {row.isActive
                ? "Online"
                : `Last seen: ${getLastSeen(row.updatedAt)}`}
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        label: "Action",
        render: (row: any) => (
          <div className="flex gap-2">
            {!row.isVerified ? (
              <button
                onClick={() => handlers.verifyUser(row.id, true)}
                className="p-1.5 text-teal-400 border border-teal-500/50 rounded hover:bg-teal-500/20 transition-colors"
                title="Authorize (Verify)"
              >
                <CheckCircle size={14} />
              </button>
            ) : (
              <button
                onClick={() => handlers.verifyUser(row.id, false)}
                className="p-1.5 text-orange-400 border border-orange-500/50 rounded hover:bg-orange-500/20 transition-colors"
                title="Restrict (Unverify)"
              >
                <XCircle size={14} />
              </button>
            )}
            {row.isActive ? (
              <button
                onClick={() => handlers.onBanClick(row.id)}
                className="p-1.5 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/10 transition-colors"
                title="Ban"
              >
                <Ban size={14} />
              </button>
            ) : (
              <button
                onClick={() => handlers.onUnbanClick(row.id)}
                className="p-1.5 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/10 transition-colors"
                title="Restore Access"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              onClick={() => handlers.onDeleteClick(row.id)}
              title="Delete Teacher"
              className="p-1.5 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ];
  } else if (activeTab === "all") {
    return [
      ...commonColumns,
      {
        key: "role",
        label: "System Role",
        sortable: true,
        render: (row: any) => (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
              row.role === "ADMIN"
                ? "text-teal-400 border-teal-500/30 bg-teal-500/5"
                : row.role === "TEACHER"
                ? "text-purple-400 border-purple-500/30 bg-purple-500/5"
                : "text-blue-400 border-blue-500/30 bg-blue-500/5"
            }`}
          >
            {row.role}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row: any) => (
          <span
            className={`text-[10px] font-bold ${
              row.isActive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {row.isActive ? "ACTIVE" : "BANNED"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Action",
        render: (row: any) => (
          <div className="flex gap-2">
            <button
              onClick={() => handlers.onDeleteClick(row.id)}
              title="Delete Account"
              className="p-1.5 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ];
  } else if (activeTab === "pending") {
    return [
      {
        key: "name",
        label: "Account Name",
        sortable: true,
        render: (row: any) => (
          <div>
            <p className="font-bold text-teal-100 text-sm">{row.name}</p>
            <p className="text-[10px] text-teal-500/70">{row.email}</p>
          </div>
        ),
      },
      {
        key: "role",
        label: "Requested Role",
        sortable: true,
        render: (row: any) => (
          <span className="uppercase text-xs font-bold text-purple-400">
            {row.role}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Registered At",
        sortable: true,
        render: (row: any) => (
          <span className="text-slate-400 text-xs">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Decision",
        render: (row: any) => (
          <div className="flex gap-2">
            <button
              onClick={() => handlers.approveUser(row.id)}
              className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/50 hover:bg-emerald-500/30 transition-all text-xs font-bold uppercase"
            >
              <CheckCircle size={14} /> Approve
            </button>
            <button
              onClick={() => handlers.onDeleteClick(row.id)}
              className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/50 hover:bg-red-500/30 transition-all text-xs font-bold uppercase"
            >
              <Trash2 size={14} /> Reject
            </button>
          </div>
        ),
      },
    ];
  } else {
    // ADMIN
    return [
      ...commonColumns,
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row: any) => (
          <span className="text-teal-500 text-[10px] uppercase tracking-wider">
            [SYSTEM_ROOT]
          </span>
        ),
      },
      {
        key: "actions",
        label: "Action",
        render: (row: any) => (
          <div className="flex gap-2">
            <button
              onClick={() => handlers.onDeleteClick(row.id)}
              title="Delete Admin"
              className="p-1.5 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ];
  }
};
