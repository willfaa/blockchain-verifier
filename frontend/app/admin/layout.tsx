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
  Home,
  User as UserIcon,
} from "lucide-react";
import api from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

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
    <div className="flex h-screen w-full bg-dark-bg text-slate-100 font-sans selection:bg-neon-purple/30 overflow-hidden">
      {/* Sidebar - GALAXY THEME (Sticky Viewport, No laggy animations, Icon-only when collapsed) */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } sticky top-0 h-screen shrink-0 hidden md:flex flex-col border-r border-white/5 bg-dark-bg/80 backdrop-blur-2xl z-30 overflow-y-auto`}
      >
        {/* Brand */}
        <div
          className={`h-24 flex items-center ${
            isCollapsed ? "justify-center px-2" : "px-8"
          } border-b border-white/5 shrink-0`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center shrink-0 border border-neon-purple/30 shadow-[0_0_20px_rgba(176,38,255,0.1)]">
              <ShieldAlert className="text-neon-purple h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
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
        <nav className={`flex-1 py-8 ${isCollapsed ? "px-3" : "px-6"} space-y-2`}>
          {!isCollapsed && (
            <p className="px-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">
              Menu Navigation
            </p>
          )}

          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href;
            const activeBorders = [
              "border-neon-purple/40 bg-neon-purple/10 text-white shadow-[0_0_15px_rgba(176,38,255,0.1)]",
              "border-neon-blue/40 bg-neon-blue/10 text-white shadow-[0_0_15px_rgba(0,229,255,0.1)]",
              "border-neon-pink/40 bg-neon-pink/10 text-white shadow-[0_0_15px_rgba(255,0,255,0.1)]",
              "border-neon-soft-blue/40 bg-neon-soft-blue/10 text-white shadow-[0_0_15px_rgba(112,161,255,0.1)]",
            ];

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`group flex items-center gap-4 ${
                  isCollapsed ? "justify-center p-3.5" : "px-4 py-3.5"
                } rounded-2xl border ${
                  isActive
                    ? activeBorders[idx % 4]
                    : "text-white/40 border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  size={20}
                  className="shrink-0"
                />

                {!isCollapsed && (
                  <span className="text-sm font-semibold tracking-tight truncate">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Back to Main LMS & Collapse Toggle */}
        <div className="border-t border-white/5 p-4 space-y-2 shrink-0">
          <Link
            href="/"
            title={isCollapsed ? "Dashboard Umum" : undefined}
            className={`flex items-center gap-3 w-full py-3 rounded-2xl border border-white/5 hover:border-neon-purple/30 hover:bg-neon-purple/10 text-white/60 hover:text-white transition-all text-xs font-semibold ${
              isCollapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            <Home size={18} className="text-neon-purple shrink-0" />
            {!isCollapsed && <span>Dashboard Umum</span>}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/5 text-white/40 hover:text-white"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft
              size={18}
              className={isCollapsed ? "rotate-180" : ""}
            />
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Collapse
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-dark-bg">
        {/* Glow Backdrop */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-purple/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Top Bar */}
        <header className="h-20 border-b border-white/5 bg-dark-bg/60 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 sticky top-0 z-20 w-full">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-4">
              <span className="text-neon-purple opacity-40">//</span>
              {menuItems.find((i) => i.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {/* Back to Public LMS / Dashboard Umum Button */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 bg-white/5 hover:bg-neon-purple/10 border border-white/10 hover:border-neon-purple/30 text-white/80 hover:text-white group text-xs font-semibold shadow-sm"
              title="Kembali ke Dashboard Umum"
            >
              <Home size={15} className="text-neon-purple group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Dashboard Umum</span>
            </Link>

            {/* Admin Profile Shortcut */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-purple/30 transition-all text-left group"
              title="Lihat Profil Admin"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-neon-purple/20 flex items-center justify-center border border-white/10">
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="text-neon-purple w-4 h-4" />
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[9px] text-neon-purple font-semibold uppercase tracking-wider mt-0.5">
                  Admin
                </p>
              </div>
            </Link>

            {/* Live Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_10px_#00e5ff] animate-pulse"></div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Live Status
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 group hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
              title="Sign Out"
            >
              <LogOut
                size={16}
                className="text-red-500 group-hover:animate-pulse"
              />
              <span className="text-xs font-bold text-red-500 tracking-tight hidden sm:inline">
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
