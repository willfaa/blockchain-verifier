"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  ChevronLeft,
  ShieldAlert,
  LogOut,
  Globe,
  BookOpen,
  Layers,
  Palette,
} from "lucide-react";
import api from "@/lib/api";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react"; // Import Loader icon

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use Global Auth Context
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    // Only verify AFTER loading is complete
    if (!isLoading) {
      if (!user || user.role !== "admin") {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  // Prevent render while loading or if unauthorized
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10" />
          <p className="text-sm font-bold tracking-widest uppercase">
            Verifying Admin Access...
          </p>
        </div>
      </div>
    );
  }

  // If not loading and not admin, return null (redirecting)
  if (!user || user.role !== "admin") {
    return null;
  }

  const menuItems = [
    {
      label: "System Overview",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    { label: "Users & Roles", icon: Users, href: "/admin/users" },
    {
      label: "All Courses",
      icon: BookOpen,
      href: "/admin/courses",
    },
    {
      label: "Expertise Fields",
      icon: Layers,
      href: "/admin/expertise",
    },
    {
      label: "Certificate Template",
      icon: Palette,
      href: "/admin/template",
    },
    {
      label: "Transaction Logs",
      icon: FileText,
      href: "/admin/certificates",
    },
    {
      label: "Network Explorer",
      icon: Globe,
      href: "/admin/explorer",
    },
  ];

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-100 font-sans selection:bg-neon-purple/30 overflow-hidden">
      {/* Sidebar - GALAXY THEME */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } relative hidden md:flex flex-col border-r border-white/5 bg-dark-bg/40 backdrop-blur-2xl transition-all duration-300 z-30`}
      >
        {/* Brand */}
        <div
          className={`h-24 flex items-center ${
            isCollapsed ? "justify-center" : "px-8"
          } border-b border-white/5`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center shrink-0 border border-neon-purple/30 shadow-[0_0_20px_rgba(176,38,255,0.1)]">
              <ShieldAlert className="text-neon-purple h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="font-bold text-xl tracking-tight text-white">
                  User Records <span className="text-neon-purple">Hub</span>
                </h1>
                <p className="text-[10px] text-white/40 font-semibold tracking-widest uppercase">
                  Institutional Controls
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-12 px-6 space-y-3">
          {!isCollapsed && (
            <p className="px-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-6">
              Menu Navigation
            </p>
          )}

          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href;
            const colors = [
              "group-hover:text-neon-purple",
              "group-hover:text-neon-blue",
              "group-hover:text-neon-pink",
              "group-hover:text-neon-soft-blue",
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
                className={`group flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? `text-white ${activeBorders[idx % 4]}`
                    : "text-white/40 border-transparent hover:bg-white/5 hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <item.icon
                  size={22}
                  className={`transition-all duration-300 ${
                    isActive ? "animate-float" : colors[idx % 4]
                  }`}
                />

                {!isCollapsed && (
                  <span className="text-sm font-semibold tracking-tight">
                    {item.label}
                  </span>
                )}

                {isActive && !isCollapsed && (
                  <div
                    className={`absolute right-4 w-1.5 h-1.5 rounded-full animate-pulse ${
                      idx % 4 === 0
                        ? "bg-neon-purple shadow-[0_0_10px_#b026ff]"
                        : idx % 4 === 1
                        ? "bg-neon-blue shadow-[0_0_10px_#00e5ff]"
                        : idx % 4 === 2
                        ? "bg-neon-pink shadow-[0_0_10px_#ff00ff]"
                        : "bg-neon-soft-blue shadow-[0_0_10px_#70a1ff]"
                    }`}
                  ></div>
                )}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-dark-bg">
        {/* Glow Backdrop */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-purple/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Top Bar */}
        <header className="h-20 border-b border-white/5 bg-dark-bg/60 backdrop-blur-xl flex items-center justify-between px-12 sticky top-0 z-20 w-full">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-4">
            <span className="text-neon-purple opacity-40">//</span>
            {menuItems.find((i) => i.href === pathname)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_10px_#00e5ff] animate-pulse"></div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Live Status
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
            >
              <LogOut
                size={16}
                className="text-red-500 group-hover:animate-pulse"
              />
              <span className="text-xs font-bold text-red-500 tracking-tight">
                Logout
              </span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 md:p-14 relative z-10 animate-in fade-in duration-1000">
          {children}
        </div>
      </main>
    </div>
  );
}
