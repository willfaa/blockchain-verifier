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
  const [loading, setLoading] = useState(true);

  // Requirement: Default to "all" (All Users)
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("All Majors");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // --- FETCH LOGIC ---
  const fetchUsers = useCallback(async () => {
    if (activeTab === "bulk") return;

    // 1. CLEANUP (Prevent Ghost Data)
    setUsers([]);
    setLoading(true);

    try {
      let endpoint = "";
      let params: any = { sortBy, sortOrder };

      if (activeTab === "pending") {
        endpoint = "/admin/users/pending";
      } else {
        // Core Alignment: Target the /active endpoint for all approved users
        endpoint = "/admin/users/active";

        // Role Mapping layer (supports both singular and plural for robustness)
        const roleMap: Record<string, string> = {
          all: "ALL",
          admin: "ADMIN",
          admins: "ADMIN",
          teacher: "TEACHER",
          teachers: "TEACHER",
          student: "STUDENT",
          students: "STUDENT",
        };

        params.role = roleMap[activeTab] || activeTab.toUpperCase();

        // Filter Application
        if (searchQuery) params.search = searchQuery;
        if (selectedMajor !== "All Majors") params.majority = selectedMajor;
        if (selectedProgram !== "All Programs")
          params.program = selectedProgram;
      }

      console.log(
        `[AdminFetch] Requesting ${endpoint} with role: ${params.role}`
      );
      const res = await api.get(endpoint, { params });

      // Handle common response structures
      if (res.data?.ok && Array.isArray(res.data.data)) {
        setUsers(res.data.data);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
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
  ]);

  // Sync on state change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- ACTIONS ---

  const verifyUser = async (id: string, isVerify: boolean) => {
    try {
      const action = isVerify ? "verify" : "unverify";
      await api.put(`/admin/users/${id}/${action}`);
      toast.success(isVerify ? "User verified!" : "User unverified!");
      fetchUsers();
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
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Identity deleted from registry");
      fetchUsers();
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const approveUser = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      toast.success("Authorization granted!");
      fetchUsers();
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
