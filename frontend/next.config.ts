// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000", // Allow backend port
        pathname: "/uploads/**", // Allow uploads folder
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // Keep this for user avatars
      },
    ],
  },
  devIndicators: false,
};

export default nextConfig;
