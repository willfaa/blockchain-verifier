export type UserRole = "student" | "teacher" | "admin";
export type TabType =
  | "all"
  | "student"
  | "teacher"
  | "admin"
  | "pending"
  | "bulk";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  nim?: string;
  nip?: string;
  majority?: string;
  studyProgram?: string;
  isActive: boolean;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}
