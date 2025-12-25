import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${path}`;
};

export const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "") || "";
};
