// app/teacher/layout.tsx
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  PlusCircle,
  Award,
  LogOut,
  Users,
  Search,
  Bell,
  Home,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Menu, // Added Menu
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarUrl } from "@/lib/utils";

// ... existing imports

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Proteksi Route Manual
  useEffect(() => {
    setIsMounted(true); // Hydration fix
    const stored = localStorage.getItem("chainnesa_user");
    if (!stored) {
      router.push("/login");
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role !== "teacher" && parsed.role !== "admin") {
          router.push("/courses"); // Redirect unauthorized users
        }
      } catch (e) {
        localStorage.removeItem("chainnesa_user");
        router.push("/login");
      }
    }
  }, [router]);

  const menuItems = [
    { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/teacher/students", icon: Users },
    { label: "Instructors", href: "/teacher/teachers", icon: Users },
    {
      label: "Create Course",
      href: "/teacher/create-course",
      icon: PlusCircle,
    },
    { label: "Issue Certificate", href: "/teacher/certificate", icon: Award },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0b0724] text-slate-200 font-sans">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? "w-20" : "w-72"
        } border-r border-white/5 bg-[#0d0b2f]/80 backdrop-blur-xl flex-col transition-all duration-300 ease-in-out z-30`}
      >
        {/* Logo Section */}
        <div
          className={`h-20 flex items-center border-b border-white/5 relative transition-all duration-300 ${
            isCollapsed ? "justify-center" : "justify-start px-6"
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
              Cn
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl text-white tracking-wide animate-in fade-in duration-300">
                Chainnesa
              </span>
            )}
          </Link>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-[#0b0724] border border-white/10 rounded-full p-1 text-cyan-400 hover:text-white hover:scale-110 transition-all shadow-lg z-50"
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 mt-6 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 animate-in fade-in">
              Main Menu
            </p>
          )}

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : ""}
                className={`group flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 relative overflow-hidden"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-l-xl"></div>
                )}
                <Icon
                  size={20}
                  className={`${
                    isActive
                      ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                      : "group-hover:text-white transition-colors"
                  } shrink-0`}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium tracking-wide truncate animate-in fade-in slide-in-from-left-2">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-2 bg-[#0b0724]/30">
          <Link
            href="/"
            title="Back to Home"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <Home size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Back to Home</span>}
          </Link>
          <button
            onClick={logout}
            title="Sign Out"
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Hiasan Global */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* --- TOP HEADER (STICKY) --- */}
        <header className="h-20 shrink-0 z-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#0b0724]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* MOBILE MENU BUTTON */}
            <div className="md:hidden">
              {isMounted && (
                <Sheet>
                  <SheetTrigger className="p-2 -ml-2 text-slate-300 hover:text-white">
                    <Menu size={24} />
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="bg-[#0d0b2f] border-r border-white/10 w-72 p-0"
                  >
                    <SheetHeader>
                      <SheetTitle className="sr-only">Teacher Menu</SheetTitle>
                    </SheetHeader>
                    <div className="h-20 flex items-center px-6 border-b border-white/5">
                      <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-500 text-lg font-bold text-slate-950">
                          Cn
                        </div>
                        <span className="font-bold text-xl text-white">
                          Chainnesa
                        </span>
                      </Link>
                    </div>
                    <nav className="p-4 space-y-2">
                      {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                              isActive
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <Icon
                              size={20}
                              className={isActive ? "text-cyan-400" : ""}
                            />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                      <div className="h-px bg-white/10 my-4" />
                      <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                      >
                        <Home size={18} />
                        <span>Home</span>
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </nav>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white tracking-tight truncate">
                {menuItems.find((item) => item.href === pathname)?.label ||
                  "Teacher Portal"}
              </h2>
              <p className="text-xs text-slate-400 truncate hidden md:block">
                Welcome back, Instructor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-3 md:pl-6 md:border-l border-white/5">
              {isMounted ? (
                <>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-white leading-none">
                      {user?.name || "Instructor"}
                    </p>
                    <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider mt-1">
                      {user?.role || "Teacher"}
                    </p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-[#0b0724] shadow-lg">
                    <AvatarImage
                      src={getAvatarUrl(user?.avatar)}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-gradient-to-tr from-fuchsia-500 to-purple-600 text-white font-bold">
                      {getInitials(user?.name || "Instr")}
                    </AvatarFallback>
                  </Avatar>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-24 bg-white/5 rounded animate-pulse hidden md:block"></div>
                  <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-8 scroll-smooth custom-scrollbar relative">
          {children}
        </main>
      </div>
    </div>
  );
}
