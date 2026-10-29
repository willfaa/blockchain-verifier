// frontend/src/app/admin/users/_components/useUserManagement.ts
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { User, TabType } from "./types";

/**
 * Hook for managing the Admin User Management view.
 * Handles fetching, filtering, and user actions (verify, ban, delete, approve).
 */
export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allTabUsers, setAllTabUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Requirement: Default to "all" (All Users)
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const getTabEndpointAndRole = useCallback((tab: TabType) => {
    if (tab === "pending") {
      return { endpoint: "/admin/users/pending", role: undefined };
    }
    const roleMap: Record<string, string> = {
      all: "ALL",
      admin: "ADMIN",
      admins: "ADMIN",
      teacher: "TEACHER",
      teachers: "TEACHER",
      student: "STUDENT",
      students: "STUDENT",
    };
    return {
      endpoint: "/admin/users/active",
      role: roleMap[tab] || tab.toUpperCase(),
    };
  }, []);

  // --- FETCH LOGIC ---
  const fetchUsers = useCallback(async () => {
    if (activeTab === "bulk") return;

    // 1. CLEANUP (Prevent Ghost Data)
    setUsers([]);
    setLoading(true);

    try {
      const { endpoint, role } = getTabEndpointAndRole(activeTab);
      const params: any = { sortBy, sortOrder };
      if (role) params.role = role;

      const isUnfiltered =
        !searchQuery &&
        selectedProgram === "All Programs" &&
        selectedMajor === "All Majors";

      // Filter Application (Program Keahlian [Umum] & Konsentrasi Keahlian [Spesifik])
      if (searchQuery) params.search = searchQuery;
      if (selectedProgram !== "All Programs") params.program = selectedProgram;
      if (selectedMajor !== "All Majors") params.majority = selectedMajor;

      const res = await api.get(endpoint, { params });
      const fetched: User[] =
        res.data?.ok && Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

      setUsers(fetched);
      if (isUnfiltered) {
        setAllTabUsers(fetched);
      }
    } catch (error: any) {
      console.error("[AdminFetch] Critical Error:", error);

      // Silent on 404 (often just means empty list)
      if (error.response?.status !== 404 && error.code !== "ERR_CANCELED") {
        toast.error("Failed to synchronize user data");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    sortBy,
    sortOrder,
    searchQuery,
    selectedMajor,
    selectedProgram,
    getTabEndpointAndRole,
  ]);

  // Ensure allTabUsers stays synced when switching tabs while a filter is already active
  useEffect(() => {
    if (activeTab === "bulk") return;
    if (
      !searchQuery &&
      selectedProgram === "All Programs" &&
      selectedMajor === "All Majors"
    ) {
      return;
    }
    const { endpoint, role } = getTabEndpointAndRole(activeTab);
    api
      .get(endpoint, { params: role ? { role } : {} })
      .then((res) => {
        const list =
          res.data?.ok && Array.isArray(res.data.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [];
        setAllTabUsers(list);
      })
      .catch(() => {});
  }, [activeTab, getTabEndpointAndRole]);

  // Sync on state change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const notifyUsersUpdated = () => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("chainnesa_users_sync");
      bc.postMessage({ type: "USERS_UPDATED", timestamp: Date.now() });
      bc.close();
    }
  };

  // --- ACTIONS ---

  const verifyUser = async (id: string, isVerify: boolean) => {
    try {
      const action = isVerify ? "verify" : "unverify";
      await api.put(`/admin/users/${id}/${action}`);
      toast.success(isVerify ? "User verified!" : "User unverified!");
      fetchUsers();
      notifyUsersUpdated();
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const banUser = async (id: string, isBan: boolean) => {
    try {
      const action = isBan ? "ban" : "unban";
      await api.put(`/admin/users/${id}/${action}`);
      toast.success(isBan ? "User banned!" : "User unbanned!");
      fetchUsers();
      notifyUsersUpdated();
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Identity deleted from registry");
      fetchUsers();
      notifyUsersUpdated();
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const approveUser = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      toast.success("Authorization granted!");
      fetchUsers();
      notifyUsersUpdated();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return {
    users,
    allTabUsers,
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
    fetchUsers,
    verifyUser,
    banUser,
    deleteUser,
    approveUser,
  };
};
