import { Search, Filter } from "lucide-react";
import { MAJORITIES, getProgramsByMajor } from "@/lib/constants/academics";

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
  activeTab,
  searchQuery,
  setSearchQuery,
  selectedMajor,
  setSelectedMajor,
  selectedProgram,
  setSelectedProgram,
}: UserFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-end">
      {/* Filters (Only for non-pending tabs usually, but harmless to show always if logic supports it) */}
      {activeTab !== "pending" && (
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
                setSelectedProgram("All Programs");
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
      )}

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
  );
};
