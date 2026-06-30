"use client";

import Link from "next/link";
import { cn, getAvatarUrl } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import {
  Lock,
  Menu,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-40 bg-dark-bg/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center">
      <div className="max-w-[1400px] mx-auto w-full px-6 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-4 transition-transform hover:scale-105"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(176,38,255,0.3)] transition-all">
            <Lock className="text-white w-6 h-6 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white">
              Chain<span className="galaxy-gradient-text">Academy</span>
            </span>
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest -mt-1">
              Secure Credentials
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          <Link
            href="/"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Courses
          </Link>
          <Link
            href="/verify"
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Verification
          </Link>

          <div className="ml-6 flex items-center gap-4 border-l border-white/10 pl-10">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-neon-purple animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-6">
                {user.role === "teacher" && (
                  <Link
                    href="/teacher/dashboard"
                    className="text-xs font-bold text-white/40 hover:text-neon-purple transition-all flex items-center gap-2 group"
                  >
                    <LayoutDashboard
                      size={14}
                      className="group-hover:animate-pulse"
                    />
                    Management
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-purple/30 transition-all outline-none group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center border border-white/10 group-hover:border-neon-purple/40">
                      {user.avatar ? (
                        <img
                          src={getAvatarUrl(user.avatar)}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <UserIcon className="text-neon-purple w-5 h-5" />
                      )}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-xs font-bold text-white group-hover:text-neon-purple transition-colors truncate w-24">
                        {user.name}
                      </p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                        {user.role}
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      className="text-white/20 group-hover:text-neon-purple transition-transform group-data-[state=open]:rotate-180"
                    />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-64 mt-4 bg-dark-bg/95 backdrop-blur-2xl border-white/5 p-2 rounded-2xl shadow-3xl">
                    <div className="p-3">
                      <p className="text-xs font-bold text-white">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-white/30 truncate w-full">
                        {user.email}
                      </p>
                    </div>
                    <div className="h-px bg-white/5 my-2 mx-1" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile/edit"
                        className="p-3 text-xs font-bold text-white/60 hover:text-white flex items-center gap-3 rounded-xl"
                      >
                        <UserIcon size={16} /> Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    {(user.role === "admin" || user.role === "teacher") && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={
                            user.role === "admin"
                              ? "/admin/dashboard"
                              : "/teacher/dashboard"
                          }
                          className="p-3 text-xs font-bold text-white/60 hover:text-white flex items-center gap-3 rounded-xl transition-all hover:bg-white/5"
                        >
                          <LayoutDashboard
                            size={16}
                            className="text-neon-purple"
                          />
                          {user.role === "admin"
                            ? "Admin Console"
                            : "Instructor Hub"}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "student" && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/student/certificates"
                          className="p-3 text-xs font-bold text-white/60 hover:text-white flex items-center gap-3 rounded-xl transition-all hover:bg-white/5"
                        >
                          <ShieldCheck size={16} className="text-neon-blue" />{" "}
                          My Credentials
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={logout}
                      className="p-3 text-xs font-bold text-red-500/60 hover:text-red-500 flex items-center gap-3 rounded-xl cursor-pointer"
                    >
                      <LogOut size={16} /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="px-6 py-3 text-xs font-bold text-white/60 hover:text-white transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-3.5 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl hover:shadow-[0_0_20px_rgba(176,38,255,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  Join Academy
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          {isMounted && (
            <Sheet>
              <SheetTrigger className="p-2 text-white/60 hover:text-white">
                <Menu size={24} />
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] border-l border-white/5 bg-dark-bg/95 backdrop-blur-2xl"
              >
                <SheetHeader className="text-left mb-10">
                  <SheetTitle className="text-white text-xl font-bold flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                      <Lock size={20} className="text-white" />
                    </div>
                    ChainAcademy
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-6">
                  <Link
                    href="/"
                    className="text-lg font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    href="/courses"
                    className="text-lg font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    Courses
                  </Link>
                  <Link
                    href="/verify"
                    className="text-lg font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    Verification
                  </Link>

                  <div className="h-px bg-white/5 my-4" />

                  {user ? (
                    <>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                          {user.avatar ? (
                            <img
                              src={getAvatarUrl(user.avatar)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="text-neon-purple" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                            {user.role}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/profile/edit"
                        className="text-lg text-white/60 hover:text-white"
                      >
                        Edit Profile
                      </Link>
                      {user.role === "student" && (
                        <Link
                          href="/student/certificates"
                          className="text-lg text-neon-blue font-bold"
                        >
                          My Credentials
                        </Link>
                      )}
                      {user.role === "teacher" && (
                        <Link
                          href="/teacher/dashboard"
                          className="text-lg text-neon-purple font-bold"
                        >
                          Management
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className="text-lg text-white/60 font-bold"
                        >
                          Admin Settings
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="text-left text-lg text-red-500/60 hover:text-red-500"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link
                        href="/login"
                        className="w-full py-4 rounded-2xl border border-white/10 text-center font-bold text-white"
                      >
                        Log In
                      </Link>
                      <Link
                        href="/register"
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-blue text-center font-bold text-white"
                      >
                        Join Academy
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  );
}
