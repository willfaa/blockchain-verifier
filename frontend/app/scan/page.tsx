"use client";

import { useState, useEffect } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { Navbar } from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { Camera, Upload, AlertCircle } from "lucide-react";
import clsx from "clsx";

export default function ScanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    // Only init scanner if in camera tab and browser environment
    if (activeTab === "camera" && typeof window !== "undefined") {
      // Short timeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText: string) => {
            handleScanSuccess(decodedText, scanner);
          },
          (errorMessage: string) => {
            // ignore frequent scan errors
          }
        );

        // Cleanup function
        return () => {
          scanner.clear().catch((error: unknown) => {
            console.error("Failed to clear html5-qrcode scanner. ", error);
          });
        };
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [activeTab]);

  const handleScanSuccess = (
    decodedText: string,
    scannerInstance?: Html5QrcodeScanner
  ) => {
    if (scannerInstance) {
      scannerInstance.clear();
    }
    console.log("Scanned:", decodedText);

    // Extract ID if it is a full URL
    // Expected format: http://localhost:3000/verify/CERT-123
    let targetUrl = decodedText;

    // Simple validation: check if it contains /verify/
    if (decodedText.includes("/verify/")) {
      router.push(decodedText); // Redirect directly
    } else {
      // Fallback: assume it's just the ID
      router.push(`/verify/${decodedText}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const html5QrCode = new Html5Qrcode("upload-reader");

    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err: any) {
      setScanError(
        "Could not decode QR code from this image. Please try another."
      );
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
      <Navbar />

      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display text-white">
            Scan QR Code
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Verify certificate authenticity instantly
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-2 flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("camera")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === "camera"
                ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            <Camera className="h-4 w-4" />
            Live Camera
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              activeTab === "upload"
                ? "bg-cyan-500/20 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:bg-white/5"
            )}
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl relative min-h-[400px]">
          {activeTab === "camera" ? (
            <div className="p-4 h-full flex flex-col justify-center">
              {/* The library requires an element with id */}
              <div id="reader" className="w-full"></div>
              <p className="text-center text-xs text-slate-500 mt-4">
                Point your camera at the QR code
              </p>
            </div>
          ) : (
            <div className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-full h-64 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center bg-slate-900/30 hover:border-cyan-500/50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-10 w-10 text-slate-500 mb-3" />
                <p className="text-slate-300 font-medium">
                  Click to upload QR Image
                </p>
                <p className="text-slate-500 text-xs mt-1">Supports PNG, JPG</p>
              </div>
              {scanError && (
                <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-950/30 px-4 py-2 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {scanError}
                </div>
              )}
              {/* Hidden div for html5-qrcode to process file */}
              <div id="upload-reader" className="hidden"></div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        #reader {
          border: none !important;
        }
        #reader video {
          border-radius: 1rem;
          object-fit: cover;
        }
        #reader__dashboard_section_csr button {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 6px;
          margin-top: 8px;
        }
        #reader__dashboard_section_swaplink {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
