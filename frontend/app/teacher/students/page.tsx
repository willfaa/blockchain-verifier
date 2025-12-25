// frontend/app/teacher/students/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api"; // Helper
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import CyberpunkFilterBar from "@/components/ui/CyberpunkFilterBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, BookOpen, Hash, GraduationCap } from "lucide-react";

export default function StudentListPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper local untuk memastikan URL avatar benar
  const getAvatarUrl = (path: string | null | undefined) => {
    // Return null to allow AvatarFallback (initials) to render
    if (!path || path === "null" || path === "undefined") return "";
    if (path.startsWith("http")) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `http://localhost:4000${normalized}`;
  };

  // Filter State
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [majority, setMajority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = {
          role: "student",
          search,
          program,
          majority,
          sortBy,
          sortOrder,
        };
        const res = await api.get("/users", { params });
        setStudents(res.data.data);
      } catch (error) {
        console.error("Failed to fetch students", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [search, program, majority, sortBy, sortOrder]);

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Define Columns
  const columns = [
    {
      key: "name",
      label: "Student Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          {/* Avatar Student */}
          <Avatar className="h-9 w-9 border border-white/10 shadow-lg shadow-cyan-500/20">
            <AvatarImage
              src={getAvatarUrl(row.image || row.avatar || row.avatarUrl)}
              alt={row.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-blue-600 text-white text-xs font-bold">
              {row.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold text-white">{row.name}</p>
            <p className="text-xs text-slate-500 truncate max-w-[150px]">
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "nim",
      label: "NIM / ID",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2 font-mono text-cyan-400">
          <Hash size={14} />
          {row.nim || "-"}
        </div>
      ),
    },
    {
      key: "majority",
      label: "Major",
      sortable: true,
      render: (row: any) => (
        <span className="flex items-center gap-2">
          <BookOpen size={14} className="text-fuchsia-500" />
          {typeof row.majority === "object"
            ? row.majority?.name
            : row.majority || "-"}
        </span>
      ),
    },
    {
      key: "program",
      label: "Program",
      sortable: true,
      render: (row: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
          <GraduationCap size={12} />
          {typeof row.studyProgram === "object"
            ? row.studyProgram?.name
            : row.studyProgram || "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <User className="text-cyan-400" />
            Students Directory
          </h1>
          <p className="text-slate-400 mt-2">
            Manage student data, view academic details, and track progress.
          </p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-bold text-white tracking-tighter block">
            {students.length}
          </span>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            Total Students
          </span>
        </div>
      </div>

      <CyberpunkFilterBar
        onSearch={setSearch}
        onFilterProgram={setProgram}
        onFilterMajority={setMajority}
      />

      <CyberpunkDataTable
        columns={columns}
        data={students}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        isLoading={loading}
      />
    </div>
  );
}
