import { useState, useEffect, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { ACADEMIC_DATA } from "@/lib/constants/academics";
import api from "@/lib/api";

interface UserFiltersProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedMajor: string;
  setSelectedMajor: (val: string) => void;
  selectedProgram: string;
  setSelectedProgram: (val: string) => void;
}

export const UserFilters = ({
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

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-end">
      {/* Filters (Bertingkat: Program Keahlian [Umum] -> Konsentrasi Keahlian [Spesifik]) */}
      <div className="flex gap-4 flex-wrap">
        {/* 1. Program Keahlian Filter (Lebih Umum) */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/50 pointer-events-none">
            <Filter size={14} />
          </div>
          <select
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setSelectedMajor("All Majors");
            }}
            className="appearance-none bg-[#050510] border border-teal-900/50 rounded-md py-2 pl-9 pr-8 text-xs text-teal-100 focus:border-teal-500/50 focus:outline-none cursor-pointer min-w-[180px] font-mono"
          >
            <option value="All Programs">Semua Program Keahlian</option>
            {availablePrograms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Konsentrasi Keahlian Filter (Lebih Spesifik) */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/50 pointer-events-none">
            <Filter size={14} />
          </div>
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="appearance-none bg-[#050510] border border-teal-900/50 rounded-md py-2 pl-9 pr-8 text-xs text-teal-100 focus:border-teal-500/50 focus:outline-none cursor-pointer min-w-[180px] font-mono"
          >
            <option value="All Majors">Semua Konsentrasi Keahlian</option>
            {availableConcentrations.map((m) => (
              <option key={m} value={m}>
                {m}
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
          placeholder="Cari nama, NISN, NIP, keahlian..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#050510] border border-teal-900/50 rounded-md py-2 pl-9 pr-4 text-xs text-teal-100 placeholder:text-teal-900/50 focus:outline-none focus:border-teal-500/50 transition-all font-mono"
        />
      </div>
    </div>
  );
};
