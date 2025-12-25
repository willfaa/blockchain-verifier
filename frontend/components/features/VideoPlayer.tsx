"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Safe dynamic import with 'any' cast to bypass strict type issues
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 animate-pulse rounded-2xl" />
  ),
}) as any;

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const [hasWindow, setHasWindow] = useState(false);

  useEffect(() => {
    setHasWindow(true);
  }, []);

  if (!hasWindow) return null;

  return (
    <div className="relative pt-[56.25%] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls={true}
        className="absolute top-0 left-0"
        config={{
          file: {
            attributes: {
              controlsList: "nodownload", // Optional security
            },
          },
        }}
      />
    </div>
  );
}
