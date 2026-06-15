"use client";

import { useState } from "react";
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import { FileSpreadsheet } from "lucide-react";

import { useUserManagement } from "./_components/useUserManagement";
import { TabType } from "./_components/types";
import { UserFilters } from "./_components/UserFilters";
import { BulkImportModule } from "./_components/BulkImportModule";
import { UserActionDialogs } from "./_components/UserActionDialogs";
import { getColumns } from "./_components/Columns";

export default function UserManagementPage() {
  const {
    users,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedMajor,
    setSelectedMajor,
    selectedProgram,
    setSelectedProgram,
    sortBy,
    sortOrder,
    handleSort,
    verifyUser,
    banUser,
    deleteUser,
    approveUser,
    fetchUsers, // exposed for manual refresh
  } = useUserManagement();

  // --- LOCAL UI STATE FOR DIALOGS ---
  const [userToBan, setUserToBan] = useState<string | null>(null);
  const [userToUnban, setUserToUnban] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // --- HANDLERS FOR ACTIONS ---
  const executeBan = async () => {
    if (userToBan) {
      await banUser(userToBan, true);
      setUserToBan(null);
    }
  };

  const executeUnban = async () => {
    if (userToUnban) {
      await banUser(userToUnban, false);
      setUserToUnban(null);
    }
  };

  const executeDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  // --- COLUMN CONFIGURATION ---
  const handlers = {
    verifyUser,
    banUser, // Passed to satisfy interface, though click handlers are used below
    approveUser,
    onDeleteClick: setUserToDelete,
    onBanClick: setUserToBan,
    onUnbanClick: setUserToUnban,
  };

  const columns = getColumns(activeTab, handlers);

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All Users" },
    { id: "pending", label: "Pending" },
    { id: "student", label: "Students" },
    { id: "teacher", label: "Teachers" },
    { id: "admin", label: "Admins" },
    { id: "bulk", label: "Bulk Import" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER & TABS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            User Records <span className="neon-text-lime">Hub</span>
          </h1>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Control Node // Privileges & Access Management
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map((tab, idx) => {
            const activeColors = [
              "text-neon-lime bg-neon-lime/10 border-neon-lime/20",
              "text-neon-purple bg-neon-purple/10 border-neon-purple/20",
              "text-neon-blue bg-neon-blue/10 border-neon-blue/20",
              "text-neon-green bg-neon-green/10 border-neon-green/20",
              "text-white bg-white/10 border-white/20",
              "text-neon-lime bg-neon-lime/10 border-neon-lime/20",
            ];

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? activeColors[idx % activeColors.length]
                    : "text-white/20 border-transparent hover:text-white/60 hover:bg-white/[0.02]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTERS OR BULK TITLE */}
      {activeTab !== "bulk" && (
        <div className="glass-panel p-6 rounded-3xl border-transparent">
          <UserFilters
            activeTab={activeTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMajor={selectedMajor}
            setSelectedMajor={setSelectedMajor}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
          />
        </div>
      )}

      {/* CONTENT AREA */}
      {activeTab === "bulk" ? (
        <BulkImportModule onSuccess={() => setActiveTab("student")} />
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden relative min-h-[500px] border-white/5 shadow-2xl">
          {loading && (
            <div className="absolute inset-0 bg-dark-bg/60 backdrop-blur-md z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-4 border-neon-lime/20 border-t-neon-lime rounded-full animate-spin"></div>
                <div className="text-neon-lime font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">
                  Loading User Records
                </div>
              </div>
            </div>
          )}

          <CyberpunkDataTable
            columns={columns}
            data={users}
            isLoading={false} // Loading handled by overlay above
            totalItems={users.length}
            totalPages={1}
            currentPage={1}
            onPageChange={() => {}}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      )}

      {/* DIALOGS */}
      <UserActionDialogs
        userToBan={userToBan}
        setUserToBan={setUserToBan}
        executeBan={executeBan}
        userToUnban={userToUnban}
        setUserToUnban={setUserToUnban}
        executeUnban={executeUnban}
        userToDelete={userToDelete}
        setUserToDelete={setUserToDelete}
        executeDelete={executeDelete}
      />
    </div>
  );
}
