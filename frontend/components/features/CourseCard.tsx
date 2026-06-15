"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { stripHtml } from "@/lib/utils";
import { BookOpen, User, ArrowRight } from "lucide-react";

interface CourseCardProps {
  id: string; // Add ID for linking
  title: string;
  description: string;
  image: string;
  teacherName?: string;
  lessonCount?: number;
  category?: string;
}

export default function CourseCard({
  id,
  title,
  description,
  image,
  teacherName = "Instructor",
  lessonCount = 0,
  category = "Development",
}: CourseCardProps) {
  return (
    <Link
      href={`/courses/${id}`}
      className="group relative flex h-full min-h-[400px] w-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-neon-lime/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
    >
      {/* Dynamic Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-lime/5 via-transparent to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="relative z-10 p-6 flex flex-col flex-1 h-full">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-2 mb-6 group-hover:border-neon-lime/20 transition-colors duration-500">
          <img
            src={image || "/course/placeholder.svg"}
            className="h-40 w-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
            alt={title}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-neon-lime mb-4">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-lime animate-pulse"></div>
            {lessonCount} Learning Units
          </span>
          <span className="text-white/40">{category}</span>
        </div>

        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 line-clamp-2 leading-tight group-hover:text-neon-lime transition-colors">
          {title}
        </h3>

        <p className="text-[11px] text-white/40 font-medium leading-relaxed line-clamp-3 mb-8 flex-1 break-words overflow-wrap-anywhere">
          {stripHtml(description) || "No description provided."}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-lime/50 transition-colors">
              <User
                size={12}
                className="text-white/40 group-hover:text-neon-lime"
              />
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest group-hover:text-white/60 transition-colors truncate max-w-[120px]">
              {teacherName}
            </span>
          </div>
          <div className="text-neon-lime group-hover:translate-x-1 transition-transform">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}
