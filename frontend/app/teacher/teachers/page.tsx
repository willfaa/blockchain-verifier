// frontend/app/teacher/teachers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import CyberpunkDataTable from "@/components/ui/CyberpunkDataTable";
import CyberpunkFilterBar from "@/components/ui/CyberpunkFilterBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, ShieldCheck, Mail, BookOpen } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper resolved dynamically via global getAvatarUrl

  // Filter State
  const [search, setSearch] = useState("");
  // Teacher might likely not have "Program", but technically User schema shares fields.
  // We'll keep filter bar consistent or simplify it if needed.
  const [majority, setMajority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = {
          role: "teacher",
          search,
          majority,
          sortBy,
          sortOrder,
        };
        const res = await api.get("/users", { params });
        setTeachers(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [search, majority, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Instructor Name",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-white/10 shadow-lg shadow-fuchsia-500/20">
            <AvatarImage
              src={getAvatarUrl(row.image || row.avatar || row.avatarUrl)}
              alt={row.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white text-xs font-bold">
              {row.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className="font-semibold text-white">{row.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ShieldCheck size={10} className="text-cyan-400" />
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Verified Instructor
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "nip",
      label: "NIP / ID",
      sortable: true,
      render: (row: any) => (
        <span className="font-mono text-slate-300">{row.nip || "-"}</span>
      ),
    },
    {
      key: "majority",
      label: "Homebase",
      sortable: true,
      render: (row: any) => (
        <span className="flex items-center gap-2 text-slate-300">
          <BookOpen size={14} className="text-slate-500" />
          {typeof row.majority === "object"
            ? row.majority?.name
            : row.majority || "General"}
        </span>
      ),
    },
    {
      key: "email",
      label: "Contact",
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2 text-slate-400">
          <Mail size={14} />
          {row.email}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <UserCheck className="text-fuchsia-500" />
            Instructor Directory
          </h1>
          <p className="text-slate-400 mt-2">
            List of active academic staff and instructors.
          </p>
        </div>
        <div className="text-left md:text-right">
          <span className="text-4xl font-bold text-white tracking-tighter block">
            {teachers.length}
          </span>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            Total Staff
          </span>
        </div>
      </div>

      <CyberpunkFilterBar
        onSearch={setSearch}
        onFilterProgram={() => {}} // Not really relevant for teachers usually, ignore
        onFilterMajority={setMajority}
      />

      <CyberpunkDataTable
        columns={columns}
        data={teachers}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        isLoading={loading}
      />
    </div>
  );
}
