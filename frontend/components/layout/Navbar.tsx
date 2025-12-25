// frontend/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/#about" },
  { label: "Verification", href: "/verify" },
];

const API_BASE_URL = "http://localhost:4000";

import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ... existing imports

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  // Fix Hydration Mismatch for Radix UI (Sheet)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getFullAvatarUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0b2f]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-14">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-3 transition hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/25">
            Cn
          </div>
          <div>
            <p className="text-lg font-semibold">Chainnesa</p>
            <p className="text-xs text-slate-300">Blockchain-based LMS</p>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`transition-all duration-300 relative group ${
                  isActive
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-bold scale-105"
                    : "text-slate-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-400 hover:via-fuchsia-500 hover:to-pink-500"
                }`}
              >
                {link.label}
                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                )}
                {/* Hover Underline Animation */}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
              </Link>
            );
          })}
          {user?.role === "student" && (
            <Link
              href="/student/certificates"
              className="transition hover:text-white hover:underline font-medium text-teal-400"
            >
              My Certificates
            </Link>
          )}
          {user?.role === "teacher" && (
            <Link
              href="/teacher/dashboard"
              className="transition hover:text-white hover:underline"
            >
              Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="transition px-3 py-1 rounded border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 text-xs font-bold uppercase tracking-wider"
            >
              [ Admin Console ]
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {!user ? (
            <>
              {/* Desktop Verify/Login */}
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/verify"
                  className="rounded-full border border-white/25 px-4 py-2 font-semibold transition hover:border-white hover:-translate-y-0.5"
                >
                  Verify
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-linear-to-r from-fuchsia-500 via-orange-400 to-amber-300 px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              </div>

              {/* MOBILE MENU TRIGGER (Public) */}
              <div className="md:hidden">
                {isMounted && (
                  <Sheet>
                    <SheetTrigger className="p-2 text-slate-300 hover:text-white">
                      <Menu size={24} />
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-[300px] border-l border-white/10 bg-[#0b0724]"
                    >
                      <SheetHeader className="text-left mb-6">
                        <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-cyan-400 to-blue-500" />
                          Chainnesa
                        </SheetTitle>
                      </SheetHeader>

                      <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="text-lg font-medium text-slate-300 hover:text-white transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                        <div className="h-px bg-white/10 my-2" />
                        <Link
                          href="/login"
                          className="text-center w-full rounded-xl bg-linear-to-r from-fuchsia-500 to-orange-400 py-3 font-bold text-slate-950"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/verify"
                          className="text-center w-full rounded-xl border border-white/20 py-3 font-bold text-white hover:bg-white/5"
                        >
                          Verify Certificate
                        </Link>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            </>
          ) : (
            // LOGGED IN VIEW
            // Keep user avatar visible on mobile, maybe simplify
            <>
              <div className="flex items-center gap-3 mr-2">
                {/* Hide text on mobile */}
                <div className="text-right hidden sm:block max-w-[140px]">
                  <p className="text-xs text-slate-400 uppercase font-bold">
                    {user.role}
                  </p>
                  <p className="font-semibold text-white leading-tight">
                    {user.name}
                  </p>
                </div>

                {/* Avatar always visible */}
                <div className="h-8 w-8 rounded-full bg-linear-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-slate-950 overflow-hidden relative">
                  {user.avatar ? (
                    <img
                      src={getFullAvatarUrl(user.avatar) || ""}
                      alt="User"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{user.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/profile/edit"
                  className="rounded-full border border-white/20 hover:bg-white/10 px-3 py-2 text-xs font-semibold transition flex items-center gap-1"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-2 text-xs font-semibold transition"
                >
                  Logout
                </button>
              </div>

              {/* MOBILE MENU (Logged In) */}
              <div className="md:hidden ml-2">
                {isMounted && (
                  <Sheet>
                    <SheetTrigger className="p-2 text-slate-300 hover:text-white">
                      <Menu size={24} />
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="bg-[#0b0724] border-l border-white/10"
                    >
                      <SheetHeader className="mb-6 text-left">
                        <SheetTitle className="sr-only">User Menu</SheetTitle>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-linear-to-tr from-cyan-400 to-blue-500 overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={getFullAvatarUrl(user.avatar) || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-950">
                                {user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="text-xs text-slate-400 uppercase">
                              {user.role}
                            </p>
                          </div>
                        </div>
                      </SheetHeader>
                      <div className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="text-lg text-slate-300 hover:text-white"
                          >
                            {link.label}
                          </Link>
                        ))}
                        {user?.role === "student" && (
                          <Link
                            href="/student/certificates"
                            className="text-lg text-teal-400 font-bold"
                          >
                            My Certificates
                          </Link>
                        )}
                        {user.role === "teacher" && (
                          <Link
                            href="/teacher/dashboard"
                            className="text-lg text-cyan-400 font-bold"
                          >
                            Dashboard
                          </Link>
                        )}
                        <div className="h-px bg-white/10 my-2" />
                        <Link
                          href="/profile/edit"
                          className="text-lg text-slate-300"
                        >
                          Edit Profile
                        </Link>
                        <button
                          onClick={logout}
                          className="text-left text-lg text-red-400 hover:text-red-300"
                        >
                          Sign Out
                        </button>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
