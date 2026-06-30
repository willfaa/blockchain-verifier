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

export const getApiBase = () => {
  // Always use local API URL in development mode
  if (process.env.NODE_ENV === "development") {
    const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      // Replace localhost/127.0.0.1 with the active local IP address so it works on mobile devices testing locally
      return base.replace("localhost", window.location.hostname).replace("127.0.0.1", window.location.hostname);
    }
    return base;
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return `${window.location.origin}/_/backend`;
    }
  } else {
    // Server-side rendering (SSR) on Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/_/backend`;
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/_/backend`;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

export const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  const cleanPath = normalizeLocalPath(path);
  if (cleanPath.startsWith("http")) return cleanPath;
  if (cleanPath.startsWith("Qm") && cleanPath.length >= 46) {
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io";
    return `${gateway}/ipfs/${cleanPath}`;
  }
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${getApiBase()}${normalizedPath}`;
};

export const getAssetUrl = (path: string | null | undefined) => {
  if (!path) return "";
  const cleanPath = normalizeLocalPath(path);
  if (cleanPath.startsWith("http")) return cleanPath;
  if (cleanPath.startsWith("Qm") && cleanPath.length >= 46) {
    const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io";
    return `${gateway}/ipfs/${cleanPath}`;
  }
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${getApiBase()}${normalizedPath}`;
};

export const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "") || "";
};
