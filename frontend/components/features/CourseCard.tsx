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
      className="group relative flex h-full min-h-[360px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/25 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-fuchsia-500/20"
    >
      <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-2xl transition group-hover:scale-110"></div>

      <div className="space-y-4 p-5 flex flex-col flex-1">
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <img
            src={image || "/course/placeholder.svg"}
            className="h-36 w-full object-cover rounded-lg"
            alt={title}
          />
        </div>

        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-cyan-100">
          <span>{lessonCount} Modules</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
        </div>

        <h3 className="text-xl font-semibold text-white line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-slate-200 line-clamp-3 flex-1">
          {stripHtml(description) || "No description provided."}
        </p>
      </div>
    </Link>
  );
}
