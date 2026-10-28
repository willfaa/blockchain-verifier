// frontend/components/ui/CyberpunkFilterBar.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { ACADEMIC_DATA } from "@/lib/constants/academics";
import api from "@/lib/api";

interface FilterBarProps {
  onSearch: (value: string) => void;
  onFilterProgram: (value: string) => void;
  onFilterMajority: (value: string) => void;
}

export default function CyberpunkFilterBar({
  onSearch,
  onFilterProgram,
  onFilterMajority,
}: FilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
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

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const availablePrograms = useMemo(
    () => Object.keys(hierarchyMap).sort(),
    [hierarchyMap],
  );

  const availableConcentrations = useMemo(() => {
    if (!selectedProgram) {
      return Array.from(new Set(Object.values(hierarchyMap).flat())).sort();
    }
    return (hierarchyMap[selectedProgram] || []).slice().sort();
  }, [hierarchyMap, selectedProgram]);

  const handleProgramChange = (value: string) => {
    setSelectedProgram(value);
    setSelectedMajor("");
    onFilterProgram(value);
    onFilterMajority("");
  };

  const handleMajorChange = (value: string) => {
    setSelectedMajor(value);
    onFilterMajority(value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 animate-in fade-in slide-in-from-top-2">
      {/* Search Input */}
      <div className="flex-1 relative">
        <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block">
          Search Database
        </label>
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NISN, NIP, atau email..."
            className="w-full bg-[#0d0b2f]/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
          />
          <Search
            className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
            size={18}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters (Bertingkat: Program Keahlian [Umum] -> Konsentrasi Keahlian [Spesifik]) */}
      <div className="flex gap-4 flex-wrap">
        {/* 1. PROGRAM KEAHLIAN FILTER (UMUM) */}
        <div className="w-56">
          <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block">
            Program Keahlian
          </label>
          <div className="relative">
            <select
              onChange={(e) => handleProgramChange(e.target.value)}
              value={selectedProgram}
              className="w-full appearance-none bg-[#0d0b2f]/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer text-sm truncate"
            >
              <option value="">Semua Program Keahlian</option>
              {availablePrograms.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
            <Filter
              className="absolute right-4 top-3.5 text-slate-500 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {/* 2. KONSENTRASI KEAHLIAN FILTER (SPESIFIK) */}
        <div className="w-56">
          <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block">
            Konsentrasi Keahlian
          </label>
          <div className="relative">
            <select
              onChange={(e) => handleMajorChange(e.target.value)}
              value={selectedMajor}
              className="w-full appearance-none bg-[#0d0b2f]/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer text-sm truncate"
            >
              <option value="">Semua Konsentrasi Keahlian</option>
              {availableConcentrations.map((conc) => (
                <option key={conc} value={conc}>
                  {conc}
                </option>
              ))}
            </select>
            <Filter
              className="absolute right-4 top-3.5 text-slate-500 pointer-events-none"
              size={16}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
