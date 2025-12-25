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
  Globe, // Added Globe Icon
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
      label: "System_Overview",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    { label: "Users_&_Roles", icon: Users, href: "/admin/users" },
    {
      label: "Transaction_Logs",
      icon: FileText,
      href: "/admin/certificates",
    },
    {
      label: "Network_Explorer",
      icon: Globe,
      href: "/admin/explorer",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0724] text-teal-50 font-mono selection:bg-teal-900/50">
      {/* Sidebar - TERMINAL THEME (Teal/Black) */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } relative hidden md:flex flex-col border-r border-teal-900/30 bg-[#050510] transition-all duration-300 shadow-[0_0_50px_rgba(45,212,191,0.05)] z-20`}
      >
        {/* Brand */}
        <div
          className={`h-20 flex items-center ${
            isCollapsed ? "justify-center" : "px-6"
          } border-b border-teal-900/20`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-900/20 flex items-center justify-center shrink-0 border border-teal-500/50 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
              <ShieldAlert className="text-teal-400 h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg tracking-tight text-teal-100">
                  SYSTEM_MONITOR
                </h1>
                <p className="text-[10px] text-teal-500 font-bold tracking-widest uppercase">
                  v2.0.4 :: ROOT
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold text-teal-900/50 uppercase tracking-widest mb-4">
              ./modules
            </p>
          )}

          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "bg-teal-900/20 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.1)]"
                    : "text-slate-500 hover:text-teal-300 hover:bg-teal-900/10"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                )}
                <item.icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? "text-teal-400" : "group-hover:text-teal-300"
                  }`}
                />

                {!isCollapsed && (
                  <span className="text-sm tracking-tight font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 bg-[#050510] border border-teal-900/50 rounded-md p-1 text-teal-500 hover:text-white hover:bg-teal-600 transition-all shadow-lg shadow-teal-900/20"
        >
          <ChevronLeft
            size={14}
            className={`transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Footer / User Profile Stub */}
        <div className="p-4 border-t border-teal-900/20">
          <div
            className={`flex items-center gap-3 ${
              isCollapsed
                ? "justify-center"
                : "bg-teal-900/10 p-3 rounded-lg border border-teal-900/20"
            }`}
          >
            <div className="w-8 h-8 rounded bg-teal-950 flex items-center justify-center text-xs font-bold text-teal-500 border border-teal-800">
              SU
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-teal-200 truncate">
                  SysAdmin
                </p>
                <p className="text-[10px] text-teal-500 truncate">
                  uid: 0 | root
                </p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group hover:bg-red-500/10 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <LogOut
              size={16}
              className="text-red-400 group-hover:text-red-300"
            />
            {!isCollapsed && (
              <span className="text-xs font-bold text-red-400 group-hover:text-red-300 uppercase tracking-wider">
                System_Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0b0724]">
        {/* Top Bar */}
        <header className="h-16 border-b border-teal-900/20 bg-[#0b0724]/90 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-teal-500 opacity-50 text-xl">~/</span>
            {menuItems.find((i) => i.href === pathname)?.label || "dashboard"}
          </h2>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded bg-teal-950/50 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
              SECURE_CONN_ESTABLISHED
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
