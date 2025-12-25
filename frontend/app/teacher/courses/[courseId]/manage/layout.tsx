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
  Menu, // New import
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

    // Use shared API instance which handles token extraction from 'chainnesa_user'
    api
      .get(`/lms/teacher/courses/${courseId}`)
      .then((res) => {
        setCourse(res.data.data);
      })
      .catch((err) => {
        console.error("Sidebar context load error:", err);
        // Handle Token Expiry
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          // Redirect to login or show alert
          console.warn("Token invalid, redirecting...");
          // router.push("/login"); // Optional: Auto-redirect
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [courseId]);

  return (
    <div className="flex h-screen bg-[#0b0724] text-white font-mono overflow-hidden flex-col md:flex-row">
      {/* Sidebar specific for Course Management (Desktop) */}
      <aside className="hidden md:flex w-64 border-r border-teal-900/30 bg-[#050510] flex-col">
        <div className="p-6 border-b border-teal-900/30 min-h-[88px] flex items-center">
          {course ? (
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-3 group w-full hover:bg-white/5 p-2 -ml-2 rounded-xl transition-all"
            >
              <img
                src={
                  course.thumbnail
                    ? course.thumbnail.startsWith("http")
                      ? course.thumbnail
                      : `${
                          process.env.NEXT_PUBLIC_API_URL ||
                          "http://localhost:4000"
                        }${course.thumbnail}`
                    : "/course/placeholder.svg"
                }
                alt="Thumbnail"
                className="w-12 h-8 rounded-md object-cover border border-white/10 group-hover:border-teal-400/50 transition-colors"
              />
              <div className="flex flex-col overflow-hidden">
                <h2 className="text-sm font-bold text-white truncate w-full group-hover:text-teal-400 transition-colors">
                  {course.title}
                </h2>
                <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase">
                  EDITING MODE
                </span>
              </div>
            </Link>
          ) : (
            <div>
              <h2
                className={`text-xl font-bold uppercase tracking-widest text-teal-500 ${
                  loading ? "animate-pulse" : ""
                }`}
              >
                CMS_Terminal
              </h2>
              <p className="text-[10px] text-teal-800 mt-1">
                v2.0.4 [Teacher_Mode]
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-teal-500/10 text-teal-400 border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                    : "text-teal-500/50 hover:text-teal-300 hover:bg-teal-900/10"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-teal-900/30">
          <Link
            href="/teacher/dashboard"
            className="flex items-center justify-center w-full py-2 border border-teal-900/50 text-teal-600 text-xs font-bold uppercase rounded hover:bg-teal-900/20 hover:text-teal-400 transition-colors"
          >
            &larr; Exit_Console
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none"></div>

        {/* Mobile Header with Menu Trigger */}
        <div className="md:hidden p-4 border-b border-teal-900/30 flex items-center justify-between bg-[#050510] relative z-20">
          <Sheet>
            <SheetTrigger className="flex items-center gap-2 text-teal-400 hover:text-white transition-colors">
              <Menu size={24} />
              <span className="font-bold uppercase tracking-wider text-sm">
                Course Menu
              </span>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-[#050510] border-r border-teal-900/30 p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Manage Course Menu</SheetTitle>
              </SheetHeader>
              {/* Mobile Sidebar Content (Clone of Desktop) */}
              <div className="p-6 border-b border-teal-900/30 min-h-[88px] flex items-center">
                {course ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={
                        course.thumbnail
                          ? course.thumbnail.startsWith("http")
                            ? course.thumbnail
                            : `${
                                process.env.NEXT_PUBLIC_API_URL ||
                                "http://localhost:4000"
                              }${course.thumbnail}`
                          : "/course/placeholder.svg"
                      }
                      alt="Thumb"
                      className="w-12 h-8 rounded-md object-cover border border-white/10"
                    />
                    <div className="overflow-hidden">
                      <h2 className="text-sm font-bold text-white truncate">
                        {course.title}
                      </h2>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase">
                        Editing Mode
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>Loading...</div>
                )}
              </div>

              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? "bg-teal-500/10 text-teal-400 border border-teal-500/50"
                          : "text-teal-500/50 hover:text-teal-300"
                      }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="mt-8 pt-4 border-t border-teal-900/30">
                  <Link
                    href="/teacher/dashboard"
                    className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase hover:text-teal-400"
                  >
                    &larr; Exit Console
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <div className="font-bold text-sm text-teal-500 truncate max-w-[150px]">
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
