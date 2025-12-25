"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import clsx from "clsx";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
  emptyMessage = "No results found.",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch(""); // Reset search when closed
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div
      ref={containerRef}
      className={clsx("relative w-full", className, {
        "opacity-60 cursor-not-allowed": disabled,
      })}
    >
      {/* TRIGGER */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white transition-all hover:border-white/20 hover:bg-white/5",
          isOpen ? "ring-2 ring-cyan-500/50 border-cyan-500" : ""
        )}
      >
        <span className={value ? "text-white" : "text-slate-500"}>
          {value || placeholder}
        </span>

        <div className="flex items-center gap-2">
          {value && !disabled && (
            <div
              onClick={handleClear}
              className="text-slate-500 hover:text-white transition-colors p-1 z-10"
            >
              <X size={14} />
            </div>
          )}
          <ChevronDown
            className={clsx(
              "h-4 w-4 text-slate-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* DROPDOWN CONTENT */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-xl shadow-black/50 ring-1 ring-white/10">
          {/* Search Input Area */}
          <div className="flex items-center border-b border-white/5 px-3 py-2">
            <Search className="mr-2 h-4 w-4 text-slate-500" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              placeholder="Search..."
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={clsx(
                    "relative flex cursor-pointer select-none items-center px-4 py-2.5 text-sm outline-none transition-colors hover:bg-cyan-500/10 hover:text-cyan-400",
                    option === value
                      ? "text-cyan-400 bg-cyan-500/5 text-bold"
                      : "text-slate-300"
                  )}
                >
                  <span className="flex-1 truncate">{option}</span>
                  {option === value && (
                    <Check className="ml-2 h-4 w-4 text-cyan-400" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
