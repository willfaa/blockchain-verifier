// frontend/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export type UserRole = "student" | "teacher" | "admin" | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string; // Tambahkan ini agar TypeScript tidak marah
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  login: (userData: User, redirectPath?: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("chainnesa_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);

        // Fetch fresh user data from database to auto-heal stale avatar/name/profile URLs
        api
          .get("/auth/me")
          .then((res) => {
            if (res.data.ok && res.data.data) {
              const freshUser = {
                ...parsedUser,
                ...res.data.data,
              };
              setUser(freshUser);
              localStorage.setItem("chainnesa_user", JSON.stringify(freshUser));
            }
          })
          .catch((err) => {
            console.warn("Failed to sync user session on mount:", err.message);
          });
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem("chainnesa_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, redirectPath?: string | null) => {
    setUser(userData);
    setRole(userData.role);
    localStorage.setItem("chainnesa_user", JSON.stringify(userData));

    if (redirectPath === null) return;
    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    // --- UPDATE REDIRECT LOGIC ---
    if (userData.role === "teacher") {
      router.push("/teacher/dashboard"); // Ganti dari /issuer ke dashboard
    } else if (userData.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/courses");
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("chainnesa_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
