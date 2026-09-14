// frontend/components/features/CertificateTranscriptPage.tsx
"use client";

import React from "react";
import { getApiBase } from "@/lib/utils";

export interface CompetencyItem {
  code?: string;
  title: string;
  score?: number | string;
  standard?: string;
  result?: string;
}

export interface TranscriptProps {
  studentName?: string;
  studentId?: string;
  majority?: string;
  program?: string;
  courseTitle?: string;
  units?: CompetencyItem[];
  averageScore?: number | string;
  examinerName?: string;
  examinerTitle?: string;
  examinerNip?: string;
  schoolName?: string;
  issuedDate?: string;
  paperSize?: string;
  paperWidthCm?: number;
  paperHeightCm?: number;
  layout?: "HORIZONTAL" | "VERTICAL";
  theme?: "light" | "dark" | "formal_border" | "minimal_clean" | "gold_accent" | string;
  bgPath?: string | null;
  headerTitle?: string;
  subHeaderTitle?: string;
  footerNote?: string;
  signatureUrl?: string | null;
}

const DPI = 150;
const CM_TO_PX = DPI / 2.54;

const PAPER_PRESETS_CM: Record<string, { width: number; height: number }> = {
  A4: { width: 29.7, height: 21.0 },
  F4: { width: 33.0, height: 21.5 },
  LETTER: { width: 27.94, height: 21.59 },
};

export const resolveTranscriptBgUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const apiBase = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
};

export const CertificateTranscriptPage: React.FC<TranscriptProps> = ({
  studentName = "Student Name",
  studentId = "0123456789",
  majority = "Teknik Komputer dan Jaringan",
  program = "Teknik Komputer Jaringan",
  courseTitle,
  units = [],
  averageScore,
  examinerName = "Sonny Michael Wijaya, S.Kom",
  examinerTitle = "Penguji / Asesor Uji Kompetensi",
  examinerNip,
  schoolName,
  issuedDate,
  paperSize = "A4",
  paperWidthCm: customWidthCm,
  paperHeightCm: customHeightCm,
  layout = "HORIZONTAL",
  theme = "light",
  bgPath = null,
  headerTitle,
  subHeaderTitle,
  footerNote,
  signatureUrl,
}) => {
  // Compute paper dimensions
  const preset = PAPER_PRESETS_CM[paperSize.toUpperCase()] || PAPER_PRESETS_CM.A4;
  let widthCm = customWidthCm || preset.width;
  let heightCm = customHeightCm || preset.height;

  if (layout === "VERTICAL" && widthCm > heightCm) {
    const temp = widthCm;
    widthCm = heightCm;
    heightCm = temp;
  } else if (layout === "HORIZONTAL" && widthCm < heightCm) {
    const temp = widthCm;
    widthCm = heightCm;
    heightCm = temp;
  }

  const canvasWidth = Math.round(widthCm * CM_TO_PX);
  const canvasHeight = Math.round(heightCm * CM_TO_PX);

  // Fallback sample units if none provided
  const displayUnits: CompetencyItem[] =
    units && units.length > 0
      ? units
      : [
          { code: "J.620100.004.01", title: "Memahami dasar pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.009.02", title: "Memahami tipe data dan variable", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.017.02", title: "Menerapkan operator dan percabangan", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.025.02", title: "Menerapkan algoritma pemrograman", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.033.02", title: "Menerapkan debugging dan error handling pada program", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.041.01", title: "Menerapkan user interface", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.048.01", title: "Menerapkan bahasa pemrograman basis data", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
          { code: "J.620100.052.02", title: "Menggunakan pemrograman berorientasi objek", score: "90.00", standard: "SKKNI", result: "KOMPETEN" },
        ];

  // Calculate average score if not provided
  let calculatedAvg = averageScore;
  if (calculatedAvg === undefined || calculatedAvg === null || calculatedAvg === "") {
    const validScores = displayUnits
      .map((u) => (u.score !== undefined && u.score !== null ? parseFloat(String(u.score)) : NaN))
      .filter((s) => !isNaN(s));

    if (validScores.length > 0) {
      const sum = validScores.reduce((a, b) => a + b, 0);
      calculatedAvg = (sum / validScores.length).toFixed(2);
    } else {
      calculatedAvg = "90.00";
    }
  }

  const isDark = theme === "dark";
  const isGold = theme === "gold_accent";
  const isFormalBorder = theme === "formal_border";
  const resolvedBg = resolveTranscriptBgUrl(bgPath);
  const resolvedSig = resolveTranscriptBgUrl(signatureUrl);

  const finalHeaderTitle = headerTitle || `KOMPETENSI KEAHLIAN ${(majority || program || "TEKNOLOGI INFORMASI").toUpperCase()}`;
  const finalSubHeaderTitle = subHeaderTitle || "DAFTAR KOMPETENSI / SUB. KOMPETENSI (TRANSKRIP NILAI SKKNI)";
  const finalFooterNote = footerNote || "Dokumen Digital Sah & Terverifikasi Blockchain Ledger · Standar SKKNI & IDUKA";

  return (
    <div
      className={`relative overflow-hidden shadow-2xl font-sans mx-auto select-none flex flex-col justify-between ${
        isDark ? "bg-[#0B0F19] text-white" : "bg-white text-slate-900"
      }`}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        padding: isFormalBorder ? "40px 52px" : "36px 48px",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Custom Background Image Layer */}
      {resolvedBg ? (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={resolvedBg}
            alt="Background Transkrip"
            className="w-full h-full object-cover select-none"
            crossOrigin="anonymous"
          />
        </div>
      ) : (
        <>
          {/* Procedural Theme Accents */}
          {isGold ? (
            <>
              <div className="absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-3.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 pointer-events-none" />
              <div className="absolute top-3.5 left-0 w-16 h-12 bg-amber-500/20 rounded-br-3xl pointer-events-none" />
              <div className="absolute bottom-3.5 right-0 w-16 h-12 bg-amber-500/20 rounded-tl-3xl pointer-events-none" />
            </>
          ) : isFormalBorder ? (
            <>
              {/* Outer Border Double Lines */}
              <div className="absolute inset-4 border-2 border-slate-800 pointer-events-none" />
              <div className="absolute inset-5 border border-slate-400 pointer-events-none" />
              <div className="absolute top-4 left-4 w-6 h-6 border-b-2 border-r-2 border-slate-800 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-t-2 border-l-2 border-slate-800 pointer-events-none" />
            </>
          ) : (
            <>
              {/* Modern Cyan / Blue Accents */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-500 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 pointer-events-none" />
              <div className="absolute top-3 left-0 w-12 h-12 bg-sky-400/20 rounded-br-3xl pointer-events-none" />
              <div className="absolute bottom-3 left-0 w-16 h-10 bg-sky-500/20 rounded-tr-3xl pointer-events-none" />
              <div className="absolute bottom-3 right-0 w-16 h-10 bg-cyan-500/20 rounded-tl-3xl pointer-events-none" />
            </>
          )}

          {/* Watermark Logo / Center Emblem */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
            <div className="w-96 h-96 rounded-full border-[20px] border-slate-900 flex items-center justify-center font-black text-9xl">
              SKKNI
            </div>
          </div>
        </>
      )}

      {/* 2. HEADER SECTION */}
      <div className={`text-center relative z-10 space-y-1 ${resolvedBg ? "bg-white/85 backdrop-blur-xs p-3 rounded-2xl shadow-xs border border-slate-200/60" : ""}`}>
        <h2 className={`text-2xl font-extrabold tracking-wide uppercase ${isDark ? "text-cyan-400" : isGold ? "text-amber-600" : "text-sky-700"}`}>
          {finalHeaderTitle}
        </h2>
        <h3 className={`text-lg font-black tracking-wider uppercase ${isDark ? "text-amber-400" : isGold ? "text-amber-700" : "text-slate-800"}`}>
          {finalSubHeaderTitle}
        </h3>
        {courseTitle && (
          <p className="text-xs text-slate-600 font-medium tracking-wide">
            Skema / Program Sertifikasi: <span className="font-bold text-slate-900">{courseTitle}</span>
          </p>
        )}
      </div>

      {/* 3. STUDENT META INFO */}
      <div className={`relative z-10 flex justify-between items-end text-sm font-medium px-3 py-2 my-2 ${resolvedBg ? "bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/70 text-slate-800 shadow-xs" : isDark ? "text-slate-300" : "text-slate-700"}`}>
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="w-16 text-slate-500 font-semibold">Nama</span>
            <span>:</span>
            <span className="font-bold text-slate-950 uppercase">{studentName}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 text-slate-500 font-semibold">NIS / ID</span>
            <span>:</span>
            <span className="font-mono font-bold text-sky-700">{studentId}</span>
          </div>
        </div>
        {schoolName && (
          <div className="text-right text-xs">
            <span className="text-slate-500 font-medium">Satuan Pendidikan / Lembaga:</span>{" "}
            <span className="font-bold text-slate-900">{schoolName}</span>
          </div>
        )}
      </div>

      {/* 4. TABLE OF COMPETENCIES & SCORES */}
      <div className={`relative z-10 flex-1 my-2 overflow-hidden flex flex-col justify-start rounded-xl ${resolvedBg ? "bg-white/95 backdrop-blur-xs p-2 border border-slate-300 shadow-sm" : ""}`}>
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className={`${isDark ? "bg-slate-800 text-white" : isGold ? "bg-amber-100/90 text-amber-950" : "bg-slate-100 text-slate-900"} font-bold border-b border-slate-400`}>
              <th className="border border-slate-400 py-2 px-3 w-12 text-center">No</th>
              <th className="border border-slate-400 py-2 px-3 w-36 text-center">Kode Unit</th>
              <th className="border border-slate-400 py-2 px-4 text-left uppercase">
                DAFTAR UNIT KOMPETENSI / SUB-KOMPETENSI
              </th>
              <th className="border border-slate-400 py-2 px-4 w-28 text-center uppercase">
                Nilai
              </th>
            </tr>
          </thead>
          <tbody>
            {displayUnits.map((item, idx) => {
              const formattedScore =
                item.score !== undefined && item.score !== null && item.score !== ""
                  ? !isNaN(parseFloat(String(item.score)))
                    ? parseFloat(String(item.score)).toFixed(2)
                    : item.score
                  : "-";

              return (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0
                      ? isDark ? "bg-slate-900/60" : "bg-white"
                      : isDark ? "bg-slate-800/40" : "bg-slate-50/70"
                  } border-b border-slate-300 hover:bg-sky-50/30 transition-colors`}
                >
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono font-semibold text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono font-bold text-sky-800 text-[11px]">
                    {item.code || `UNIT-${idx + 1}`}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 font-medium text-slate-900">
                    {item.title}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 text-center font-mono font-extrabold text-slate-950">
                    {formattedScore}
                  </td>
                </tr>
              );
            })}

            {/* SUMMARY ROW: NILAI RATA-RATA */}
            <tr className={`${isDark ? "bg-slate-800" : isGold ? "bg-amber-100" : "bg-slate-100"} font-extrabold border-t-2 border-slate-500`}>
              <td
                colSpan={3}
                className="border border-slate-400 py-2.5 px-4 text-right tracking-wider uppercase text-slate-900"
              >
                NILAI RATA-RATA KOMPETENSI :
              </td>
              <td className="border border-slate-400 py-2.5 px-4 text-center font-mono text-sm font-black text-slate-950">
                {calculatedAvg}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. FOOTER & EXAMINER SIGNATURE */}
      <div className={`relative z-10 flex justify-between items-end pt-2 px-3 ${resolvedBg ? "bg-white/85 backdrop-blur-xs p-2 rounded-xl border border-slate-200/70" : ""}`}>
        <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
          <p className="font-semibold text-slate-700">{finalFooterNote}</p>
          <p>Kunci Kriptografis Hash Transkrip Terekam di Ledger Blockchain</p>
        </div>

        <div className="text-center min-w-[220px]">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            {issuedDate ? `${issuedDate}` : examinerTitle || "Penguji / Asesor Uji Kompetensi"}
          </p>

          {/* Signature Rendering: Image or SVG Simulated */}
          <div className="w-36 h-12 mx-auto my-1 flex items-center justify-center">
            {resolvedSig ? (
              <img
                src={resolvedSig}
                alt="Tanda Tangan Asesor"
                className="h-full object-contain filter contrast-125"
                crossOrigin="anonymous"
              />
            ) : (
              <svg
                viewBox="0 0 140 40"
                className="w-full h-full stroke-slate-900 fill-none stroke-2 stroke-linecap-round opacity-80"
              >
                <path d="M10 28 Q 30 5, 50 25 T 90 20 T 130 15 M35 30 L45 8 L55 35 M75 12 Q 85 28, 95 10" />
              </svg>
            )}
          </div>

          <div className="border-t border-slate-800 pt-1 font-bold text-xs text-slate-950">
            {examinerName}
          </div>
          {examinerNip && (
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">
              NIP / REG: {examinerNip}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateTranscriptPage;
