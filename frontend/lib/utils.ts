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

const normalizeLocalPath = (urlPath: string) => {
  if (!urlPath) return "";
  if (urlPath.startsWith("http://localhost:") || urlPath.startsWith("http://127.0.0.1:")) {
    return urlPath.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, "");
  }
  return urlPath;
};

const getApiBase = () => {
  return process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

export const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  const cleanPath = normalizeLocalPath(path);
  if (cleanPath.startsWith("http")) return cleanPath;
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${getApiBase()}${normalizedPath}`;
};

export const getAssetUrl = (path: string | null | undefined) => {
  if (!path) return "";
  const cleanPath = normalizeLocalPath(path);
  if (cleanPath.startsWith("http")) return cleanPath;
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${getApiBase()}${normalizedPath}`;
};

export const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "") || "";
};
