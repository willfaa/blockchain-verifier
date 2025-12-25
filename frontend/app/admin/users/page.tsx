"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import {
  CheckCircle,
  Ban,
  Search,
  User,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  Trash2,
  Clock,
  Filter,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MAJORITIES, getProgramsByMajor } from "@/lib/constants/academics";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"student" | "teacher" | "admin">(
    "student"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");

  useEffect(() => {
    fetchUsers();
  }, [activeTab, sortBy, sortOrder, selectedMajor, selectedProgram]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchUsers = () => {
    setLoading(true);
    const params: any = {
      role: activeTab,
      sortBy,
      sortOrder,
    };
    if (searchQuery) params.search = searchQuery;
    if (selectedMajor !== "All Majors") params.majority = selectedMajor;
    if (selectedProgram !== "All Programs") params.program = selectedProgram;

    api
      .get("/users", { params })
      .then((res) => {
        setUsers(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const [userToBan, setUserToBan] = useState<string | null>(null);
  const [userToUnban, setUserToUnban] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const verifyUser = (id: string) => {
    toast.dismiss();
    api
      .put(`/admin/users/${id}/verify`)
      .then(() => {
        toast.success("User Verified!");
        fetchUsers();
      })
      .catch((err) => {
        toast.error("Failed to verify");
        console.error(err);
      });
  };

  const unverifyUser = (id: string) => {
    toast.dismiss();
    api
      .put(`/admin/users/${id}/unverify`)
      .then(() => {
        toast.success("User access revoked (Unverified)!");
        fetchUsers();
      })
      .catch((err) => {
        toast.error("Failed to revoke access");
        console.error(err);
      });
  };

  const initiateBan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserToBan(id);
  };

  const executeBan = () => {
    if (!userToBan) return;
    api
      .put(`/admin/users/${userToBan}/ban`)
      .then(() => {
        toast.dismiss();
        toast.success("User has been banned.");
        fetchUsers();
        setUserToBan(null);
      })
      .catch((err) => toast.error("Failed to ban user"));
  };

  const initiateUnban = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserToUnban(id);
  };

  const executeUnban = () => {
    if (!userToUnban) return;
    api
      .put(`/admin/users/${userToUnban}/unban`)
      .then(() => {
        toast.dismiss();
        toast.success("User access restored.");
        fetchUsers();
        setUserToUnban(null);
      })
      .catch((err) => toast.error("Failed to unban user"));
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserToDelete(id);
  };

  const executeDelete = () => {
    if (!userToDelete) return;
    api
      .delete(`/admin/users/${userToDelete}`)
      .then(() => {
        toast.dismiss();
        toast.success("User deleted permanently.");
        fetchUsers();
        setUserToDelete(null);
      })
      .catch((err) => toast.error("Failed to delete user"));
  };

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

  // --- DYNAMIC COLUMNS BASED ON TAB ---
  const getColumns = () => {
    const commonColumns = [
      {
        key: "name",
        label: "Identity",
        sortable: true,
        render: (row: any) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-teal-500/30">
              <AvatarImage
                src={
                  row.avatar?.startsWith("http")
                    ? row.avatar
                    : `${
                        process.env.NEXT_PUBLIC_API_URL ||
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
          key: "nim",
          label: "NIM",
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
            <span className="text-slate-300 text-xs">
              {row.studyProgram || "-"}
            </span>
          ),
        },
        {
          key: "majority",
          label: "Majority",
          sortable: true,
          render: (row: any) => (
            <span className="text-slate-300 text-xs">
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
                  onClick={() => verifyUser(row.id)}
                  title="Authorize (Verify)"
                  className="p-1.5 text-teal-400 border border-teal-500/50 rounded hover:bg-teal-500/20 transition-colors"
                >
                  <CheckCircle size={14} />
                </button>
              ) : (
                <button
                  onClick={() => unverifyUser(row.id)}
                  title="Restrict (Unverify)"
                  className="p-1.5 text-orange-400 border border-orange-500/50 rounded hover:bg-orange-500/20 transition-colors"
                >
                  <XCircle size={14} />
                </button>
              )}
              {row.isActive ? (
                <button
                  onClick={(e) => initiateBan(row.id, e)}
                  title="Restrict Access"
                  className="p-1.5 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/10 transition-colors"
                >
                  <Ban size={14} />
                </button>
              ) : (
                <button
                  onClick={(e) => initiateUnban(row.id, e)}
                  title="Restore Access"
                  className="p-1.5 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/10 transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={(e) => initiateDelete(row.id, e)}
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
            <span className="text-slate-300 text-xs">
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
                  onClick={() => verifyUser(row.id)}
                  className="p-1.5 text-teal-400 border border-teal-500/50 rounded hover:bg-teal-500/20 transition-colors"
                  title="Authorize (Verify)"
                >
                  <CheckCircle size={14} />
                </button>
              ) : (
                <button
                  onClick={() => unverifyUser(row.id)}
                  className="p-1.5 text-orange-400 border border-orange-500/50 rounded hover:bg-orange-500/20 transition-colors"
                  title="Restrict (Unverify)"
                >
                  <XCircle size={14} />
                </button>
              )}
              {row.isActive ? (
                <button
                  onClick={(e) => initiateBan(row.id, e)}
                  className="p-1.5 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/10 transition-colors"
                  title="Ban"
                >
                  <Ban size={14} />
                </button>
              ) : (
                <button
                  onClick={(e) => initiateUnban(row.id, e)}
                  className="p-1.5 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/10 transition-colors"
                  title="Restore Access"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={(e) => initiateDelete(row.id, e)}
                title="Delete Teacher"
                className="p-1.5 text-red-400 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
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
      ];
    }
  };

  const tabs = [
    { id: "student", label: "Students" },
    { id: "teacher", label: "Teachers" },
    { id: "admin", label: "Admins" },
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-900/30 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-tight">
            User_Database
          </h1>
          <p className="text-teal-500/60 text-xs">
            Administer privileges and access controls.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all relative ${
                activeTab === tab.id
                  ? "text-teal-400"
                  : "text-slate-600 hover:text-teal-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-400 shadow-[0_0_10px_#2dd4bf]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-end">
        {/* Filters */}
        <div className="flex gap-4">
          {/* Major Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/50 pointer-events-none">
              <Filter size={14} />
            </div>
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedProgram("All Programs"); // Reset program on major change
              }}
              className="appearance-none bg-[#050510] border border-teal-900/50 rounded-md py-2 pl-9 pr-8 text-xs text-teal-100 focus:border-teal-500/50 focus:outline-none cursor-pointer min-w-[140px] font-mono"
            >
              <option value="All Majors">All Majors</option>
              {MAJORITIES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Program Filter */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/50 pointer-events-none">
              <Filter size={14} />
            </div>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="appearance-none bg-[#050510] border border-teal-900/50 rounded-md py-2 pl-9 pr-8 text-xs text-teal-100 focus:border-teal-500/50 focus:outline-none cursor-pointer min-w-[140px] font-mono"
            >
              <option value="All Programs">All Programs</option>
              {getProgramsByMajor(selectedMajor).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/50"
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050510] border border-teal-900/50 rounded-md py-2 pl-9 pr-4 text-xs text-teal-100 placeholder:text-teal-900/50 focus:outline-none focus:border-teal-500/50 transition-all font-mono"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#050510] border border-teal-900/30 rounded-lg overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-teal-500 animate-pulse text-xs uppercase tracking-widest">
              Querying_Database...
            </div>
          </div>
        )}

        <CyberpunkDataTable
          columns={getColumns()}
          data={users}
          isLoading={false} // Handled by wrapper above for aesthetic
          totalItems={users.length}
          totalPages={1}
          currentPage={1}
          onPageChange={() => {}}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>

      {/* Ban Confirmation Dialog */}
      <AlertDialog
        open={!!userToBan}
        onOpenChange={(open: boolean) => !open && setUserToBan(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-red-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} /> Restrict Access?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-xs">
              Are you sure you want to ban this user? They will immediately lose
              access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-teal-900/30 text-teal-500 hover:bg-teal-900/20 hover:text-teal-400 font-mono text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBan}
              className="bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-900/50 hover:text-red-400 font-mono text-xs uppercase"
            >
              Execute_Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Confirmation Dialog */}
      <AlertDialog
        open={!!userToUnban}
        onOpenChange={(open: boolean) => !open && setUserToUnban(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-emerald-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <CheckCircle size={18} /> Restore User Access?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-xs">
              This will restore the users access to the platform immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-teal-900/30 text-teal-500 hover:bg-teal-900/20 hover:text-teal-400 font-mono text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeUnban}
              className="bg-emerald-900/20 border border-emerald-500/50 text-emerald-500 hover:bg-emerald-900/50 hover:text-emerald-400 font-mono text-xs uppercase"
            >
              Confirm_Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open: boolean) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent className="bg-[#050510] border border-red-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Trash2 size={18} /> Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-xs">
              This action cannot be undone. This will permanently delete the
              user and their associated data (except blockchain records).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-teal-900/30 text-teal-500 hover:bg-teal-900/20 hover:text-teal-400 font-mono text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-900/50 hover:text-red-400 font-mono text-xs uppercase"
            >
              Confirm_Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
