// frontend/components/CyberpunkFilterBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { MAJORITIES, getProgramsByMajor } from "@/lib/constants/academics"; // Import Data

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
  const [selectedMajor, setSelectedMajor] = useState(""); // Track internal state
  const [programs, setPrograms] = useState<string[]>([]); // Dynamic options

  // Load programs when Major changes
  useEffect(() => {
    const availablePrograms = getProgramsByMajor(selectedMajor || null);
    setPrograms(availablePrograms);
  }, [selectedMajor]);

  // Debounce Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, onSearch]);

  const handleMajorChange = (value: string) => {
    setSelectedMajor(value);
    onFilterMajority(value);
    onFilterProgram(""); // Reset program when major changes
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
            placeholder="Search by Name, NIM, or Email..."
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

      {/* Filters */}
      <div className="flex gap-4">
        {/* MAJOR FILTER */}
        <div className="w-48">
          <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block">
            Major
          </label>
          <div className="relative">
            <select
              onChange={(e) => handleMajorChange(e.target.value)}
              value={selectedMajor}
              className="w-full appearance-none bg-[#0d0b2f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="">All Majors</option>
              {MAJORITIES.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
            <Filter
              className="absolute right-4 top-3.5 text-slate-500 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {/* PROGRAM FILTER */}
        <div className="w-48">
          <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block">
            Program
          </label>
          <div className="relative">
            <select
              onChange={(e) => onFilterProgram(e.target.value)}
              className="w-full appearance-none bg-[#0d0b2f]/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="">All Programs</option>
              {programs.map((prog) => (
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
      </div>
    </div>
  );
}
