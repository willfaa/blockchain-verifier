// frontend/app/courses/CourseDetailClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export type CourseData = {
  id?: number;
  slug?: string;
  title?: string;
  description?: string;
  modulesCount?: number;
  href?: string;
};

export type Lesson = {
  type: "Video" | "Reading" | "Quiz";
  title: string;
  duration: string;
};

export type ModuleSection = {
  title: string;
  lessons: Lesson[];
};

export type CourseDetailClientProps = {
  course: CourseData;
  modules: ModuleSection[];
  totalLessons: number;
};

export default function CourseDetailClient({
  course,
  modules,
  totalLessons,
}: CourseDetailClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(modules.map((_, idx) => [idx, true]))
  );

  const moduleCount = course.modulesCount || modules.length;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-linear-to-br from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0b2f]/80 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-lg font-semibold text-white shadow-lg shadow-cyan-500/25">
              Cn
            </div>
            <div>
              <p className="text-lg font-semibold">Chainnesa</p>
              <p className="text-xs text-slate-200/90">Course detail</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white transition hover:border-white"
            >
              {sidebarOpen ? "Hide outline" : "Show outline"}
            </button>
            <Link
              href="/courses"
              className="hidden rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white sm:inline-flex"
            >
              Back to courses
            </Link>
            <Link
              href="/verify"
              className="hidden rounded-full bg-linear-to-r from-fuchsia-500 via-orange-400 to-amber-300 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-fuchsia-500/25 transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Verify
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside
          className={`course-scroll fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-white/10 bg-white/5 backdrop-blur transition-transform duration-200 lg:static lg:z-0 lg:w-80 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex gap-3 border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
            <button className="rounded-lg bg-white/10 px-3 py-1.5 text-white shadow-inner shadow-cyan-500/20">
              Materi
            </button>
            <button className="rounded-lg px-3 py-1.5 text-slate-300 transition hover:text-white">
              Komentar 5
            </button>
          </div>

          <div className="course-scroll flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {modules.map((module, idx) => {
              const isOpen = openModules[idx];
              return (
                <div
                  key={module.title}
                  className="overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-sm shadow-black/30"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenModules((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }))
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-white"
                  >
                    <p className="text-sm font-semibold">{module.title}</p>
                    <span className="text-slate-300">{isOpen ? "-" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-white/10">
                      {module.lessons.map((lesson, lidx) => {
                        const isActive = idx === 0 && lidx === 0;
                        return (
                          <div
                            key={lesson.title}
                            className={`flex items-center justify-between px-4 py-3 text-sm ${
                              isActive
                                ? "bg-cyan-500/10 border-l-2 border-l-cyan-400"
                                : "bg-white/0"
                            } text-slate-100`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyan-300">
                                {lesson.type === "Video"
                                  ? "▶"
                                  : lesson.type === "Reading"
                                  ? "📖"
                                  : "❓"}
                              </span>
                              <span>{lesson.title}</span>
                            </div>
                            <span className="text-xs text-slate-300">
                              {lesson.duration}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-200">
            Total materi: {modules.length} modules · {totalLessons} items
          </div>
        </aside>

        {/* Main content */}
        <div className="course-scroll flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 backdrop-blur sm:px-6">
            <div>Materi 1 dari {moduleCount}</div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-full border border-white/20 px-3 py-1 transition hover:border-white">
                Prev
              </button>
              <button className="rounded-full border border-white/20 px-3 py-1 transition hover:border-white">
                Next
              </button>
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="rounded-full border border-white/20 px-3 py-1 transition hover:border-white lg:hidden"
              >
                {sidebarOpen ? "Hide outline" : "Show outline"}
              </button>
            </div>
          </div>

          <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl shadow-black/40">
              <div className="aspect-video bg-linear-to-br from-[#11132b] via-[#1c1f3e] to-[#0f142e]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-black/40 sm:h-16 sm:w-16">
                  ▶
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-linear-to-r from-fuchsia-500 via-blue-500 to-cyan-400" />
            </div>

            <div className="flex flex-col gap-3 text-slate-50 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold">
                {course.title || "Course Title"}
              </h1>
              <Link
                href="/courses"
                className="text-sm font-semibold text-cyan-200 underline hover:text-white"
              >
                Back to courses
              </Link>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-white">
                {course.description || "No description available."}
              </span>
              <button className="w-full rounded-lg bg-linear-to-r from-fuchsia-500 via-orange-400 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 shadow-md shadow-fuchsia-500/30 transition hover:-translate-y-0.5 sm:w-auto">
                Tandai Selesai
              </button>
            </div>

            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-slate-100">
              <p className="font-semibold text-white">Transcript</p>
              <p>
                Pembicara: Selamat datang di video ini. Dalam sesi ini kita
                menjelaskan konsep utama dan bagaimana menerapkannya dalam
                praktik. Gunakan catatan ini sebagai referensi cepat.
              </p>
              <p>
                Apa itu Pengalaman Pengguna (UX)? Pengalaman Pengguna adalah
                bagaimana seseorang merasakan produk atau layanan digital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
