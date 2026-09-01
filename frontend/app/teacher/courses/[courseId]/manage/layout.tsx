"use client";

import { usePathname, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Book,
  Settings,
  Video,
  Users,
  CheckSquare,
  BarChart,
  Menu,
  ClipboardList,
  Award,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { getAssetUrl } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function ManageCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const courseId = params?.courseId as string;
  const pathname = usePathname();
  const router = useRouter(); // Use router for redirection
  const baseUrl = `/teacher/courses/${courseId}/manage`;

  const navItems = [
    { label: "Basic Info", href: `${baseUrl}/basics`, icon: FileText },
    { label: "Curriculum", href: `${baseUrl}/curriculum`, icon: Book },
    {
      label: "Unit SKKNI (UKK)",
      href: `${baseUrl}/competency-units`,
      icon: Award,
    },
    {
      label: "Assignments",
      href: `${baseUrl}/assignments`,
      icon: ClipboardList,
    },
    { label: "Exam & Quiz", href: `${baseUrl}/exam`, icon: CheckSquare },
    { label: "Exam Results", href: `${baseUrl}/results`, icon: BarChart },
    { label: "Students", href: `${baseUrl}/students`, icon: Users },
    { label: "Settings", href: `${baseUrl}/settings`, icon: Settings },
  ];

  /* State for dynamic header */
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    api
      .get(`/lms/courses/${courseId}`)
      .then((res) => {
        setCourse(res.data.data);
      })
      .catch((err) => {
        console.error("Sidebar context load error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  return (
    <div className="flex h-screen bg-dark-bg text-white font-sans overflow-hidden flex-col md:flex-row">
      {/* Sidebar specific for Course Management (Desktop) - GALAXY THEME */}
      <aside className="hidden md:flex w-72 border-r border-white/5 bg-dark-bg/40 backdrop-blur-2xl flex-col z-30">
        <div className="py-10 px-8 border-b border-white/5 min-h-[120px] flex items-center">
          {course ? (
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-4 group w-full p-4 rounded-2xl transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <div className="relative shrink-0">
                <img
                  src={
                    course.imageUrl || course.thumbnail
                      ? getAssetUrl(course.imageUrl || course.thumbnail)
                      : "/course/placeholder.svg"
                  }
                  alt="Thumbnail"
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10 group-hover:border-neon-purple/50 transition-all duration-500 shadow-xl"
                />
                <div className="absolute inset-0 rounded-2xl bg-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex flex-col overflow-hidden">
                <h2 className="text-sm font-bold text-white truncate w-full group-hover:text-neon-purple transition-colors">
                  {course.title}
                </h2>
                <span className="text-[10px] text-neon-purple font-semibold tracking-widest uppercase mt-1">
                  Active Session
                </span>
              </div>
            </Link>
          ) : (
            <div className="px-2">
              <h2
                className={`text-xl font-bold tracking-tight text-white ${
                  loading ? "animate-pulse" : ""
                }`}
              >
                Curriculum <span className="text-neon-purple">Hub</span>
              </h2>
              <p className="text-[10px] text-white/30 font-semibold tracking-widest uppercase mt-2">
                Manager Workspace
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-8 space-y-3">
          <p className="px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-6">
            Module Navigator
          </p>
          {navItems.map((item, idx) => {
            const isActive = pathname.startsWith(item.href);
            const colors = [
              "text-neon-purple",
              "text-neon-blue",
              "text-neon-pink",
              "text-neon-soft-blue",
            ];
            const activeBorders = [
              "border-neon-purple/40 bg-neon-purple/10 shadow-[0_0_15px_rgba(176,38,255,0.1)]",
              "border-neon-blue/40 bg-neon-blue/10 shadow-[0_0_15px_rgba(0,229,255,0.1)]",
              "border-neon-pink/40 bg-neon-pink/10 shadow-[0_0_15px_rgba(255,0,255,0.1)]",
              "border-neon-soft-blue/40 bg-neon-soft-blue/10 shadow-[0_0_15px_rgba(112,161,255,0.1)]",
            ];

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-xs font-bold transition-all duration-300 border ${
                  isActive
                    ? `text-white ${activeBorders[idx % 4]}`
                    : "text-white/40 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon
                  size={20}
                  className={`transition-all ${
                    isActive ? "animate-float" : colors[idx % 4]
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-10 border-t border-white/5">
          <Link
            href="/teacher/dashboard"
            className="flex items-center justify-center w-full py-4 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-white/5 hover:text-white hover:border-white/20 transition-all"
          >
            &larr; Exit Management
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>

        {/* Mobile Header with Menu Trigger */}
        <div className="md:hidden p-6 border-b border-white/5 flex items-center justify-between bg-dark-bg/60 backdrop-blur-xl relative z-20">
          {/* Client-Only Render for Sheet to avoid Hydration ID Mismatch (Radix UI) */}
          {loading ? (
            <div className="flex items-center gap-3 text-white/20">
              <Menu size={24} />
              <span className="font-bold uppercase tracking-widest text-[10px]">
                Loading...
              </span>
            </div>
          ) : (
            <Sheet>
              <SheetTrigger className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                <Menu size={24} />
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  Course Menu
                </span>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-dark-bg/95 border-r border-white/5 p-0 backdrop-blur-2xl"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Manage Course Menu</SheetTitle>
                </SheetHeader>
                {/* Mobile Sidebar Content (Clone of Desktop) */}
                <div className="p-8 border-b border-white/5 min-h-[100px] flex items-center">
                  {course ? (
                    <div className="flex items-center gap-4 w-full">
                      <img
                        src={
                          course.imageUrl || course.thumbnail
                            ? getAssetUrl(course.imageUrl || course.thumbnail)
                            : "/course/placeholder.svg"
                        }
                        alt="Thumb"
                        className="w-12 h-12 rounded-xl object-cover border border-white/10"
                      />
                      <div className="overflow-hidden">
                        <h2 className="text-sm font-bold text-white truncate">
                          {course.title}
                        </h2>
                        <span className="text-[10px] text-neon-purple font-bold uppercase tracking-widest">
                          Active Session
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/20 font-bold uppercase tracking-widest text-[10px]">
                      Loading...
                    </div>
                  )}
                </div>

                <nav className="p-6 space-y-3">
                  {navItems.map((item, idx) => {
                    const isActive = pathname.startsWith(item.href);
                    const colors = [
                      "text-neon-purple",
                      "text-neon-blue",
                      "text-neon-pink",
                      "text-neon-soft-blue",
                    ];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isActive
                            ? "bg-white/5 text-white border border-white/10"
                            : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <item.icon
                          size={18}
                          className={
                            isActive ? "animate-float" : colors[idx % 4]
                          }
                        />
                        {item.label}
                      </Link>
                    );
                  })}

                  <div className="mt-10 pt-6 border-t border-white/5">
                    <Link
                      href="/teacher/dashboard"
                      className="flex items-center gap-3 text-white/20 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                      &larr; Exit Console
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          )}

          <div className="font-bold text-[10px] text-neon-blue uppercase tracking-widest truncate max-w-[150px]">
            {course?.title || "Loading..."}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-teal-900/50 scrollbar-track-transparent relative z-10 w-full">
          {/* Force min-width to prevent squashing */}
          <div className="min-w-[800px] mx-auto min-h-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
