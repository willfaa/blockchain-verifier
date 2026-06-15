"use client";

import { Loader2 } from "lucide-react";

interface CyberpunkLoaderProps {
  text?: string;
  className?: string;
}

export function CyberpunkLoader({
  text = "Loading Academic Resources",
  className = "",
}: CyberpunkLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-32 text-neon-lime font-sans ${className}`}
    >
      <div className="relative mb-8">
        {/* Decorative Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-neon-lime/10 border-dashed rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-neon-lime/20 border-dotted rounded-full animate-[spin_6s_linear_infinite_reverse]" />

        {/* Central Spinner */}
        <Loader2
          size={40}
          className="animate-spin relative z-10 text-neon-lime shadow-[0_0_15px_#dfff00]"
        />
      </div>

      {/* Text Effect */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] font-black animate-pulse text-white/40 italic">
          {text} <span className="text-neon-lime">...</span>
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-neon-lime/40 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
