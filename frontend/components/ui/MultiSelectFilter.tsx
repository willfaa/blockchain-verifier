import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export default function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const clearFilter = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
          selectedValues.length > 0
            ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
            : "bg-black/40 border-white/5 text-slate-500 hover:border-white/20"
        }`}
      >
        <span>{label}</span>
        {selectedValues.length > 0 && (
          <span className="bg-cyan-500 text-black text-[9px] font-black px-1.5 rounded-md">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-[#0b0c24] border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border border-transparent ${
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div
                    className={`shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        : "border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <Check size={10} className="text-black stroke-[4]" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold tracking-tight">
                    {option.label.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <button
                onClick={clearFilter}
                className="w-full text-center text-[9px] font-black text-slate-600 hover:text-fuchsia-500 py-1.5 transition-colors uppercase tracking-[0.2em]"
              >
                Reset_Matrix
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
