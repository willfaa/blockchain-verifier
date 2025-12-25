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

  // Close when clicking outside
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
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
          selectedValues.length > 0
            ? "bg-cyan-900/30 border-cyan-500/50 text-cyan-400"
            : "bg-[#0b0c24] border-white/10 text-slate-400 hover:border-white/20"
        }`}
      >
        <span>{label}</span>
        {selectedValues.length > 0 && (
          <span className="bg-cyan-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 bg-[#0d0b2f] border border-white/10 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-cyan-900/30 text-cyan-400"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-cyan-500 border-cyan-500"
                        : "border-slate-500"
                    }`}
                  >
                    {isSelected && <Check size={10} className="text-black" />}
                  </div>
                  <span className="text-sm">{option.label}</span>
                </div>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <button
                onClick={clearFilter}
                className="w-full text-center text-xs text-slate-500 hover:text-white py-1 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
