// frontend/components/CyberpunkDataTable.tsx
"use client";

import React from "react";
import { ArrowUp, ArrowDown, MoreHorizontal, User } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
}

interface CyberpunkDataTableProps {
  columns: Column[];
  data: any[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  isLoading?: boolean;
}

export default function CyberpunkDataTable({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
  totalItems,
  totalPages,
  currentPage,
  onPageChange,
}: CyberpunkDataTableProps & {
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0d0b2f]/30 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-bottom-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-cyan-500/20 bg-[#0b0724]/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort(col.key)}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${
                    col.sortable
                      ? "cursor-pointer hover:text-cyan-400 hover:bg-white/5 select-none transition-colors"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortBy === col.key && (
                      <span className="text-cyan-400">
                        {sortOrder === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              // Loading Skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-24"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-cyan-500/5 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm text-slate-200"
                    >
                      {col.render ? col.render(row) : row[col.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-slate-500 italic"
                >
                  No data found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#0b0724]/50">
          <span className="text-xs text-slate-500">
            Showing page{" "}
            <span className="text-white font-bold">{currentPage}</span> of{" "}
            {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange && onPageChange(currentPage! - 1)}
              className="px-3 py-1 text-xs rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange && onPageChange(currentPage! + 1)}
              className="px-3 py-1 text-xs rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
