import { useState, useEffect, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { ACADEMIC_DATA } from "@/lib/constants/academics";
import api from "@/lib/api";
import { User } from "./types";

interface UserFiltersProps {
  activeTab: string;
  users?: User[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedMajor: string;
  setSelectedMajor: (val: string) => void;
  selectedProgram: string;
  setSelectedProgram: (val: string) => void;
}

export const UserFilters = ({
  users = [],
  searchQuery,
  setSearchQuery,
  selectedMajor,
  setSelectedMajor,
  selectedProgram,
  setSelectedProgram,
}: UserFiltersProps) => {
  const [hierarchyMap, setHierarchyMap] = useState<Record<string, string[]>>(
    ACADEMIC_DATA,
  );

  useEffect(() => {
    api
      .get("/lms/departments")
      .then((res) => {
        if (res.data?.ok && Array.isArray(res.data.data)) {
          const merged: Record<string, string[]> = {};
          Object.entries(ACADEMIC_DATA).forEach(([prog, concs]) => {
            merged[prog] = [...concs];
          });

          res.data.data.forEach((bidang: any) => {
            (bidang.programKeahlian || []).forEach((prog: any) => {
              if (!prog?.name) return;
              const existing = merged[prog.name] || [];
              const childNames = (prog.konsentrasiKeahlian || [])
                .map((k: any) => k?.name)
                .filter(Boolean);
              merged[prog.name] = Array.from(
                new Set([...existing, ...childNames]),
              );
            });
          });

          setHierarchyMap(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Tingkat Umum (Induk): Program Keahlian
  const availablePrograms = useMemo(
    () => Object.keys(hierarchyMap).sort(),
    [hierarchyMap],
  );

  // Tingkat Spesifik (Anak): Konsentrasi Keahlian berdasarkan Program Keahlian yang dipilih
  const availableConcentrations = useMemo(() => {
    if (!selectedProgram || selectedProgram === "All Programs") {
      return Array.from(new Set(Object.values(hierarchyMap).flat())).sort();
    }
    return (hierarchyMap[selectedProgram] || []).slice().sort();
  }, [hierarchyMap, selectedProgram]);

  // Deteksi opsi Program Keahlian & Konsentrasi Keahlian yang memiliki data user
  const populatedPrograms = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      const rawProg = u.studyProgram ?? (u as any).program;
      const prog =
        typeof rawProg === "object" ? (rawProg as any)?.name : rawProg;
      if (prog) set.add(String(prog).trim());
    });
    return set;
  }, [users]);

  const populatedConcentrations = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      const rawProg = u.studyProgram ?? (u as any).program;
      const prog =
        typeof rawProg === "object" ? (rawProg as any)?.name : rawProg;
      if (
        selectedProgram &&
        selectedProgram !== "All Programs" &&
        prog !== selectedProgram
      ) {
        return;
      }
      const maj =
        typeof u.majority === "object"
          ? (u.majority as any)?.name
          : u.majority;
      if (maj) set.add(String(maj).trim());
    });
    return set;
  }, [users, selectedProgram]);

  const isProgramActive =
    Boolean(selectedProgram) && selectedProgram !== "All Programs";
  const isMajorActive =
    Boolean(selectedMajor) && selectedMajor !== "All Majors";
  const isSearchActive = Boolean(searchQuery.trim());

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-end">
      {/* Filters (Bertingkat: Program Keahlian [Umum] -> Konsentrasi Keahlian [Spesifik]) */}
      <div className="flex gap-4 flex-wrap">
        {/* 1. Program Keahlian Filter (Lebih Umum) */}
        <div className="relative">
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isProgramActive ? "text-emerald-400" : "text-teal-500/50"
            }`}
          >
            <Filter size={14} />
          </div>
          <select
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setSelectedMajor("All Majors");
            }}
            className={`appearance-none rounded-md py-2 pl-9 pr-8 text-xs focus:outline-none cursor-pointer min-w-[180px] font-mono transition-colors ${
              isProgramActive
                ? "bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 focus:border-emerald-400"
                : "bg-[#050510] border border-teal-900/50 text-teal-100 focus:border-teal-500/50"
            }`}
          >
            <option
              value="All Programs"
              className="bg-[#050510] text-teal-100"
              style={{ backgroundColor: "#050510", color: "#ccfbf1" }}
            >
              Semua Program Keahlian
            </option>
            {availablePrograms.map((p) => {
              const hasData = populatedPrograms.has(p);
              return (
                <option
                  key={p}
                  value={p}
                  className={
                    hasData
                      ? "bg-emerald-900 text-emerald-200 font-semibold"
                      : "bg-[#050510] text-teal-100"
                  }
                  style={
                    hasData
                      ? { backgroundColor: "#064e3b", color: "#a7f3d0" }
                      : { backgroundColor: "#050510", color: "#ccfbf1" }
                  }
                >
                  {p}
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Konsentrasi Keahlian Filter (Lebih Spesifik) */}
        <div className="relative">
          <div
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isMajorActive ? "text-emerald-400" : "text-teal-500/50"
            }`}
          >
            <Filter size={14} />
          </div>
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className={`appearance-none rounded-md py-2 pl-9 pr-8 text-xs focus:outline-none cursor-pointer min-w-[180px] font-mono transition-colors ${
              isMajorActive
                ? "bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 focus:border-emerald-400"
                : "bg-[#050510] border border-teal-900/50 text-teal-100 focus:border-teal-500/50"
            }`}
          >
            <option
              value="All Majors"
              className="bg-[#050510] text-teal-100"
              style={{ backgroundColor: "#050510", color: "#ccfbf1" }}
            >
              Semua Konsentrasi Keahlian
            </option>
            {availableConcentrations.map((m) => {
              const hasData = populatedConcentrations.has(m);
              return (
                <option
                  key={m}
                  value={m}
                  className={
                    hasData
                      ? "bg-emerald-900 text-emerald-200 font-semibold"
                      : "bg-[#050510] text-teal-100"
                  }
                  style={
                    hasData
                      ? { backgroundColor: "#064e3b", color: "#a7f3d0" }
                      : { backgroundColor: "#050510", color: "#ccfbf1" }
                  }
                >
                  {m}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-64">
        <Search
          size={14}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            isSearchActive ? "text-emerald-400" : "text-teal-500/50"
          }`}
        />
        <input
          type="text"
          placeholder="Cari nama, NISN, NIP, keahlian..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-md py-2 pl-9 pr-4 text-xs placeholder:text-teal-900/50 focus:outline-none transition-all font-mono ${
            isSearchActive
              ? "bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 focus:border-emerald-400"
              : "bg-[#050510] border border-teal-900/50 text-teal-100 focus:border-teal-500/50"
          }`}
        />
      </div>
    </div>
  );
};
