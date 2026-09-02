// frontend/components/features/CertificateTemplate.tsx
"use client";

import React from "react";
import { QrCode } from "lucide-react";
import { LayoutElement, BackgroundConfig, CertificateLayoutConfig } from "./CertificateEditor";

export interface CertificateProps {
  studentName?: string;
  courseName?: string;
  completionDate?: string;
  certificateId?: string;
  studentId?: string;
  program?: string;
  majority?: string;
  issuedAt?: string;
  qrCodeBase64?: string;
  certId?: string;
  instructorName?: string;
  instructorNip?: string;
  layout?: "HORIZONTAL" | "VERTICAL";
  paperSize?: string;
  paperWidthCm?: number;
  paperHeightCm?: number;
  bgPath?: string | null;
  layoutConfig?: CertificateLayoutConfig | Record<string, LayoutElement> | null;
  backgroundConfig?: BackgroundConfig;
}

// Helper: Format Date
const formatDate = (dateString?: string) => {
  if (!dateString) return "DATE NOT SET";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

const DPI = 150;
const CM_TO_PX = DPI / 2.54;

const PAPER_PRESETS_CM: Record<string, { width: number; height: number }> = {
  A4: { width: 29.7, height: 21.0 },
  F4: { width: 33.0, height: 21.5 },
  LETTER: { width: 27.94, height: 21.59 },
};

const CertificateTemplate: React.FC<CertificateProps> = ({
  studentName = "Student Name",
  courseName = "Course Name",
  completionDate,
  certificateId,
  studentId = "Student ID",
  program = "Program",
  majority = "Majority",
  issuedAt,
  qrCodeBase64,
  certId,
  instructorName = "Dr. Budi Santoso, M.T.",
  instructorNip = "198706152010121002",
  layout = "HORIZONTAL",
  paperSize = "A4",
  paperWidthCm: customWidthCm,
  paperHeightCm: customHeightCm,
  bgPath,
  layoutConfig,
  backgroundConfig,
}) => {
  const finalId = certId || certificateId || "ID-0000";
  const rawDate = issuedAt || completionDate;
  const finalDate = formatDate(rawDate);

  // Extract config elements
  const hasWrapped = layoutConfig && "elements" in layoutConfig && layoutConfig.elements;
  const wrappedConfig = hasWrapped ? (layoutConfig as CertificateLayoutConfig) : null;
  const elements = (hasWrapped ? (layoutConfig as any).elements : layoutConfig) as Record<string, LayoutElement> | undefined;
  
  const followTemplateDesign = wrappedConfig?.followTemplateDesign !== undefined ? wrappedConfig.followTemplateDesign : true;
  const showDecorativeFrame = wrappedConfig?.showDecorativeFrame !== undefined ? wrappedConfig.showDecorativeFrame : true;
  const canvasBgColor = wrappedConfig?.canvasBgColor || "#0B0F19";

  const bgCfg: BackgroundConfig = backgroundConfig || wrappedConfig?.backgroundConfig || {
    scaleX: 100,
    scaleY: 100,
    offsetX: 0,
    offsetY: 0,
    lockAspectRatio: true,
    fitMode: "custom",
    opacity: 100,
  };

  // Dimensions
  const preset = PAPER_PRESETS_CM[paperSize.toUpperCase()] || PAPER_PRESETS_CM.A4;
  let widthCm = customWidthCm || (hasWrapped ? (layoutConfig as any).paperWidthCm : undefined) || preset.width;
  let heightCm = customHeightCm || (hasWrapped ? (layoutConfig as any).paperHeightCm : undefined) || preset.height;

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

  // If custom layout elements are provided, render purely data-driven layers
  if (elements && Object.keys(elements).length > 0) {
    const dynamicValues: Record<string, string> = {
      universityTitle: "UNIVERSITAS NEGERI SURABAYA",
      certificateTitle: "CERTIFICATE OF COMPLETION",
      certIdLabel: `ID: ${finalId}`,
      presentedTo: "PROUDLY PRESENTED TO",
      studentName: studentName,
      majorProgram: `${majority.toUpperCase()} - ${program.toUpperCase()}`,
      studentId: `Student ID : ${studentId}`,
      courseSubtitle: "Has successfully completed the educational and training program requirements on the topic of:",
      courseTitle: courseName,
      instructorName: instructorName,
      instructorTitle: "HEAD INSTRUCTOR",
      instructorNip: `Instructor ID: ${instructorNip}`,
      issuedDateTitle: "DATE ISSUED",
      issuedDateBox: finalDate,
      scanToVerifyLabel: "SCAN TO VERIFY",
    };

    // Sort elements by zIndex for exact stacking order
    const sortedElements = Object.entries(elements).sort(
      ([, a], [, b]) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    return (
      <div
        className="relative text-white overflow-hidden shadow-2xl font-sans mx-auto select-none"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          backgroundColor: canvasBgColor,
        }}
      >
        {/* Background template image if uploaded */}
        {bgPath && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0"
            style={{ opacity: (bgCfg.opacity ?? 100) / 100 }}
          >
            {bgCfg.fitMode === "stretch" ? (
              <img src={bgPath} alt="Background" className="w-full h-full object-fill" />
            ) : bgCfg.fitMode === "cover" ? (
              <img src={bgPath} alt="Background" className="w-full h-full object-cover" />
            ) : bgCfg.fitMode === "contain" ? (
              <img src={bgPath} alt="Background" className="w-full h-full object-contain" />
            ) : (
              <img
                src={bgPath}
                alt="Background"
                style={{
                  width: `${bgCfg.scaleX ?? 100}%`,
                  height: `${bgCfg.scaleY ?? 100}%`,
                  transform: `translate(${bgCfg.offsetX ?? 0}px, ${bgCfg.offsetY ?? 0}px)`,
                  objectFit: "fill",
                }}
              />
            )}
          </div>
        )}

        {/* Decorative Frame (Only if followTemplateDesign && showDecorativeFrame) */}
        {followTemplateDesign && showDecorativeFrame && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {canvasBgColor === "#0B0F19" && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B0F19] to-blue-950" />
            )}
            <div className="absolute inset-8 border-2 border-cyan-500/60 pointer-events-none" />
            <div className="absolute inset-12 border border-sky-400/40 pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
            <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-cyan-400 pointer-events-none" />
            <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-cyan-400 pointer-events-none" />
          </div>
        )}

        {/* Render Variable Layers */}
        {sortedElements.map(([key, el]) => {
          if (!el || el.visible === false) return null;

          if (el.type === "text") {
            const text = dynamicValues[key] !== undefined ? dynamicValues[key] : (el.text || "");
            if (!text) return null;

            return (
              <div
                key={el.id || key}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  transform: el.align === "center" ? "translateX(-50%)" : el.align === "right" ? "translateX(-100%)" : "none",
                  fontFamily: el.fontFamily || "Arial",
                  fontSize: `${el.fontSize || 24}px`,
                  color: el.colorMode === "gradient" ? "transparent" : el.color || "#ffffff",
                  backgroundImage:
                    el.colorMode === "gradient"
                      ? `linear-gradient(to right, ${el.color}, ${el.gradientColor2 || "#38bdf8"})`
                      : undefined,
                  WebkitBackgroundClip: el.colorMode === "gradient" ? "text" : undefined,
                  filter: el.hasGlow
                    ? `drop-shadow(0 0 ${el.glowBlur || 12}px ${el.glowColor || el.color})`
                    : undefined,
                  fontWeight: el.bold ? "bold" : "normal",
                  fontStyle: el.italic ? "italic" : "normal",
                  textAlign: el.align || "left",
                  whiteSpace: "nowrap",
                  zIndex: el.zIndex !== undefined ? el.zIndex : 10,
                }}
              >
                {followTemplateDesign && key === "presentedTo" && (
                  <div
                    className={`absolute inset-0 -mx-5 -my-2 rounded-full -z-10 ${
                      canvasBgColor === "#ffffff"
                        ? "bg-slate-100 border border-slate-300"
                        : "bg-slate-900 border border-cyan-900"
                    }`}
                  />
                )}
                {followTemplateDesign && key === "issuedDateBox" && (
                  <div
                    className={`absolute inset-0 -mx-5 -my-2.5 rounded-xl -z-10 ${
                      canvasBgColor === "#ffffff"
                        ? "bg-slate-100 border border-slate-300"
                        : "bg-slate-900 border border-white/5"
                    }`}
                  />
                )}
                {text}
              </div>
            );
          }

          if (el.type === "shape") {
            const w = el.width || 200;
            const h = el.height || 100;
            return (
              <div
                key={el.id || key}
                style={{
                  position: "absolute",
                  left: `${el.x - w / 2}px`,
                  top: `${el.y - h / 2}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                  backgroundColor: el.fillType === "none" ? "transparent" : el.color,
                  backgroundImage:
                    el.fillType === "gradient"
                      ? `linear-gradient(to bottom right, ${el.color}, ${el.gradientColor2 || "#38bdf8"})`
                      : undefined,
                  border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || "transparent"}` : "none",
                  borderRadius:
                    el.shapeType === "circle"
                      ? "9999px"
                      : el.borderRadius !== undefined
                      ? `${el.borderRadius}px`
                      : el.shapeType === "badge"
                      ? "9999px"
                      : el.shapeType === "rounded-rect"
                      ? "16px"
                      : "0px",
                  opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                  zIndex: el.zIndex !== undefined ? el.zIndex : 5,
                }}
              />
            );
          }

          if (el.type === "line") {
            return (
              <div
                key={el.id || key}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  transform: "translateX(-50%)",
                  width: `${el.width || 240}px`,
                  height: `${el.height || 2}px`,
                  backgroundColor: el.color || "#334155",
                  zIndex: el.zIndex !== undefined ? el.zIndex : 10,
                }}
              />
            );
          }

          if (el.type === "image") {
            if (key === "qrCode" || el.id === "qrCode") {
              const qWidth = el.width || 140;
              const qHeight = el.height || 140;
              return (
                <div
                  key={el.id || key}
                  style={{
                    position: "absolute",
                    left: `${el.x - qWidth / 2}px`,
                    top: `${el.y - qHeight / 2}px`,
                    width: `${qWidth}px`,
                    height: `${qHeight}px`,
                    zIndex: el.zIndex !== undefined ? el.zIndex : 10,
                    filter: el.hasGlow
                      ? `drop-shadow(0 0 ${el.glowBlur || 12}px ${el.glowColor || "#38bdf8"})`
                      : undefined,
                    opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                  }}
                  className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-center shadow-sm"
                >
                  {qrCodeBase64 ? (
                    <img src={qrCodeBase64} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode size={qWidth * 0.8} className="text-slate-900 w-full h-full" />
                  )}
                </div>
              );
            }

            const imgW = el.width || 100;
            const imgH = el.height || 100;
            return (
              <div
                key={el.id || key}
                style={{
                  position: "absolute",
                  left: `${el.x - imgW / 2}px`,
                  top: `${el.y - imgH / 2}px`,
                  width: `${imgW}px`,
                  height: `${imgH}px`,
                  opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                  zIndex: el.zIndex !== undefined ? el.zIndex : 10,
                }}
                className="flex items-center justify-center overflow-hidden"
              >
                {el.imageUrl && el.imageUrl !== "DEFAULT_LOGO" ? (
                  <img src={el.imageUrl} alt={el.label || "Layer Image"} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-cyan-500/50 bg-cyan-950/40 rounded-2xl text-cyan-300 p-2 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{el.label || "Logo"}</span>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }

  // Fallback default layout
  return (
    <div
      className="relative bg-[#0B0F19] text-white overflow-hidden flex flex-col items-center justify-between p-12 shadow-2xl border-[3px] border-cyan-900/50 font-sans mx-auto select-none"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
      }}
    >
      <div className="text-center z-10 flex flex-col items-center">
        <p className="text-xs tracking-widest text-slate-300 uppercase font-semibold mb-2">
          Universitas Negeri Surabaya
        </p>
        <h1 className="text-5xl font-extrabold tracking-[0.15em] uppercase text-cyan-300">
          Certificate of Completion
        </h1>
        <p className="mt-2 text-cyan-600/70 text-xs tracking-[0.3em] uppercase font-mono">
          ID: {finalId}
        </p>
      </div>

      <div className="text-center z-10 flex flex-col items-center gap-2 flex-grow justify-center mt-2">
        <h2 className="text-6xl font-extrabold tracking-tight text-white py-2 px-4 leading-tight">
          {studentName}
        </h2>
        <div className="text-slate-300 text-base uppercase tracking-wider font-medium space-y-0.5">
          <p>{majority} - {program}</p>
          <p className="text-cyan-400 font-bold">Student ID : {studentId}</p>
        </div>
        <div className="text-slate-400 text-base max-w-2xl leading-relaxed mt-4 font-light">
          Has successfully completed the educational and training program requirements on the topic of:
        </div>
        <div className="text-3xl md:text-4xl font-black text-white mt-1 px-6 py-2 uppercase">
          {courseName}
        </div>
      </div>

      <div className="w-full flex justify-between items-end mt-4 px-8 z-10 pb-4">
        <div className="text-center">
          <div className="mb-2 border-b-2 border-slate-500 pb-1 min-w-[200px]">
            <span className="font-sans text-2xl text-slate-200 font-bold italic">{instructorName}</span>
          </div>
          <p className="text-white font-bold uppercase tracking-widest text-xs">Head Instructor</p>
          <p className="text-cyan-400 text-[10px] font-mono mt-0.5">NIP: {instructorNip}</p>
        </div>

        <div className="text-center pb-2">
          <p className="text-slate-400 uppercase text-[10px] tracking-[0.2em] mb-1 font-semibold">Date Issued</p>
          <div className="px-4 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-white font-bold text-lg tracking-wider">{finalDate}</p>
          </div>
        </div>

        <div className="relative">
          <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            {qrCodeBase64 ? (
              <img src={qrCodeBase64} alt="QR Code" className="w-20 h-20 object-contain" />
            ) : (
              <QrCode className="w-20 h-20 text-slate-900" strokeWidth={1.5} />
            )}
          </div>
          <p className="text-center text-cyan-500 text-[9px] uppercase tracking-widest mt-1 font-semibold">
            Scan to Verify
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
