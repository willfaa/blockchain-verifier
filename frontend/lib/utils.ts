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
  // Client-side Browser Execution:
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // 1. If running on local machine (localhost)
    if (isLocal) {
      const localBase =
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000";
      return localBase.replace(/\/$/, "");
    }

    // 2. If running on Vercel / Remote Web Deployment:
    // Default baseline is ALWAYS Serverless Cloud (Next.js API + Supabase + Pinata)
    return window.location.origin;
  }

  // Server-side Rendering (SSR / Node.js on Vercel):
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return "http://localhost:4000";
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

/**
 * Compresses, resizes, and crops an image file to the specified dimensions and aspect ratio.
 * Runs entirely on the client-side using Canvas.
 */
export function compressAndResizeImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
    quality?: number;
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve(file);
        }

        const originalWidth = img.width;
        const originalHeight = img.height;

        const targetWidth = options.maxWidth || originalWidth;
        const targetHeight = options.maxHeight || originalHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = originalWidth;
        let sourceHeight = originalHeight;

        if (options.aspectRatio) {
          const currentAspectRatio = originalWidth / originalHeight;
          if (currentAspectRatio > options.aspectRatio) {
            sourceWidth = originalHeight * options.aspectRatio;
            sourceX = (originalWidth - sourceWidth) / 2;
          } else if (currentAspectRatio < options.aspectRatio) {
            sourceHeight = originalWidth / options.aspectRatio;
            sourceY = (originalHeight - sourceHeight) / 2;
          }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const newFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          "image/jpeg",
          options.quality || 0.8
        );
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
