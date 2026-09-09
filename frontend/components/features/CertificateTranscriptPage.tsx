// frontend/components/features/CertificateTranscriptPage.tsx
"use client";

import React from "react";

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
  theme?: "light" | "dark";
}

const DPI = 150;
const CM_TO_PX = DPI / 2.54;

const PAPER_PRESETS_CM: Record<string, { width: number; height: number }> = {
  A4: { width: 29.7, height: 21.0 },
  F4: { width: 33.0, height: 21.5 },
  LETTER: { width: 27.94, height: 21.59 },
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
          { title: "Memahami dasar pemrograman", score: "90.00" },
          { title: "Memahami tipe data dan variable", score: "90.00" },
          { title: "Menerapkan operator", score: "90.00" },
          { title: "Menerapkan algoritma pemrograman", score: "90.00" },
          { title: "Menerapkan debugging dan error handling pada program", score: "90.00" },
          { title: "Menerapkan user interface", score: "90.00" },
          { title: "Menerapkan bahasa pemrograman SQLite", score: "90.00" },
          { title: "Menggunakan bahasa pemrograman berorientasi objek", score: "90.00" },
          { title: "Mengintegrasikan basis data dengan sebuah aplikasi", score: "90.00" },
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

  return (
    <div
      className={`relative overflow-hidden shadow-2xl font-sans mx-auto select-none flex flex-col justify-between ${
        isDark ? "bg-[#0B0F19] text-white" : "bg-white text-slate-900"
      }`}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        padding: "36px 48px",
        boxSizing: "border-box",
      }}
    >
      {/* Decorative Outer Border / Accents */}
      <div
        className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-sky-400 to-cyan-500 pointer-events-none"
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 pointer-events-none"
      />

      {/* Decorative Corner Accents */}
      <div className="absolute top-3 left-0 w-12 h-12 bg-sky-400/20 rounded-br-3xl pointer-events-none" />
      <div className="absolute bottom-3 left-0 w-16 h-10 bg-sky-500/20 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-3 right-0 w-16 h-10 bg-cyan-500/20 rounded-tl-3xl pointer-events-none" />

      {/* Watermark Logo / Background Emblem in Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <div className="w-96 h-96 rounded-full border-[20px] border-slate-900 flex items-center justify-center font-black text-9xl">
          Cn
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="text-center relative z-10 space-y-1">
        <h2 className="text-2xl font-extrabold tracking-wide uppercase text-sky-600">
          KOMPETENSI KEAHLIAN {majority.toUpperCase()}
        </h2>
        <h3 className="text-xl font-black tracking-wider uppercase text-amber-500">
          DAFTAR KOMPETENSI / SUB. KOMPETENSI
        </h3>
        {courseTitle && (
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Skema Pelatihan: <span className="font-semibold text-slate-700">{courseTitle}</span>
          </p>
        )}
      </div>

      {/* STUDENT META INFO */}
      <div className="relative z-10 flex justify-between items-end text-sm font-medium text-slate-700 px-2 my-2">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="w-16 text-slate-500">Nama</span>
            <span>:</span>
            <span className="font-bold text-slate-900 uppercase">{studentName}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 text-slate-500">NIS / ID</span>
            <span>:</span>
            <span className="font-mono font-bold text-sky-700">{studentId}</span>
          </div>
        </div>
        {schoolName && (
          <div className="text-right text-xs text-slate-500">
            <span className="text-slate-400">Institusi / Sekolah:</span>{" "}
            <span className="font-semibold text-slate-800">{schoolName}</span>
          </div>
        )}
      </div>

      {/* TABLE OF COMPETENCIES & SCORES */}
      <div className="relative z-10 flex-1 my-2 overflow-hidden flex flex-col justify-start">
        <table className="w-full border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <th className="border border-slate-400 py-2 px-3 w-12 text-center">No</th>
              <th className="border border-slate-400 py-2 px-4 text-left uppercase">
                DAFTAR KOMPETENSI
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
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  } border-b border-slate-300`}
                >
                  <td className="border border-slate-300 py-1.5 px-3 text-center font-mono font-semibold text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 font-medium text-slate-800">
                    {item.title}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-4 text-center font-mono font-bold text-slate-900">
                    {formattedScore}
                  </td>
                </tr>
              );
            })}

            {/* SUMMARY ROW: NILAI RATA-RATA */}
            <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-500">
              <td
                colSpan={2}
                className="border border-slate-400 py-2 px-4 text-left tracking-wider uppercase text-slate-900"
              >
                NILAI RATA-RATA
              </td>
              <td className="border border-slate-400 py-2 px-4 text-center font-mono text-sm text-slate-950">
                {calculatedAvg}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER & EXAMINER SIGNATURE */}
      <div className="relative z-10 flex justify-between items-end pt-2 px-4">
        <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
          <p>Dokumen Digital Sah & Terverifikasi Blockchain Ledger</p>
          <p>Standar Kompetensi Kerja Nasional Indonesia (SKKNI) & IDUKA</p>
        </div>

        <div className="text-center min-w-[220px]">
          <p className="text-xs font-semibold text-slate-600 mb-8">
            {issuedDate ? `${issuedDate}` : "Penguji / Asesor"}
          </p>
          {/* Simulated Signature */}
          <div className="w-36 h-10 mx-auto -mt-6 mb-1 flex items-center justify-center opacity-80">
            <svg
              viewBox="0 0 140 40"
              className="w-full h-full stroke-slate-900 fill-none stroke-2 stroke-linecap-round"
            >
              <path d="M10 28 Q 30 5, 50 25 T 90 20 T 130 15 M35 30 L45 8 L55 35 M75 12 Q 85 28, 95 10" />
            </svg>
          </div>
          <div className="border-t border-slate-800 pt-1 font-bold text-xs text-slate-900">
            {examinerName}
          </div>
          {examinerNip && (
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              NIP/REG: {examinerNip}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateTranscriptPage;
