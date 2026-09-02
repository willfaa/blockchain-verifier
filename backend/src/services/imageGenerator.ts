import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import * as QRCode from "qrcode";
import fs from "fs";
import axios from "axios";
import { db } from "../config/db";

// --- Cross-Platform Font Registration for node-canvas ---
// In Linux/Docker environments, Windows system fonts (Arial, Times New Roman, Courier New)
// do not exist by default, causing canvas to render "tofu" boxes.
// Registering bundled open-source TTF fonts ensures clean, consistent rendering on all platforms.
const initFonts = () => {
  const possibleFontDirs = [
    path.join(process.cwd(), "assets", "fonts"),
    path.resolve(__dirname, "../../assets/fonts"),
    path.resolve(__dirname, "../assets/fonts"),
    path.resolve(__dirname, "../../../assets/fonts"),
  ];

  let fontsDir: string | null = null;
  for (const dir of possibleFontDirs) {
    if (fs.existsSync(dir)) {
      fontsDir = dir;
      break;
    }
  }

  if (!fontsDir) return;

  const fontConfigs = [
    { file: "Roboto-Regular.ttf", family: "Roboto", weight: "normal", style: "normal", alias: "Arial" },
    { file: "Roboto-Bold.ttf", family: "Roboto", weight: "bold", style: "normal", alias: "Arial" },
    { file: "Roboto-Italic.ttf", family: "Roboto", weight: "normal", style: "italic", alias: "Arial" },
    { file: "Roboto-BoldItalic.ttf", family: "Roboto", weight: "bold", style: "italic", alias: "Arial" },
    { file: "RobotoMono-Regular.ttf", family: "Roboto Mono", weight: "normal", style: "normal", alias: "Courier New" },
    { file: "RobotoMono-Bold.ttf", family: "Roboto Mono", weight: "bold", style: "normal", alias: "Courier New" },
    { file: "PlayfairDisplay-Regular.ttf", family: "Playfair Display", weight: "normal", style: "normal", alias: "Times New Roman" },
  ];

  for (const f of fontConfigs) {
    const fontPath = path.join(fontsDir, f.file);
    if (fs.existsSync(fontPath)) {
      try {
        registerFont(fontPath, { family: f.family, weight: f.weight as any, style: f.style as any });
        if (f.alias) {
          registerFont(fontPath, { family: f.alias, weight: f.weight as any, style: f.style as any });
        }
      } catch (e: any) {
        // Warning fallback
      }
    }
  }
};

initFonts();

/**
 * Resolves font-family string with comprehensive cross-platform fallbacks
 */
export const resolveCanvasFont = (
  fontFamily: string = "Arial",
  fontSize: number = 24,
  bold: boolean = false,
  italic: boolean = false
): string => {
  const cleanFamily = (fontFamily || "Arial").replace(/["']/g, "").trim().toLowerCase();
  let fallbacks = '"Arial", "Roboto", "DejaVu Sans", "Liberation Sans", sans-serif';

  if (cleanFamily.includes("courier") || cleanFamily.includes("mono")) {
    fallbacks = '"Courier New", "Roboto Mono", "DejaVu Sans Mono", monospace';
  } else if (
    cleanFamily.includes("times") ||
    cleanFamily.includes("serif") ||
    cleanFamily.includes("georgia") ||
    cleanFamily.includes("playfair")
  ) {
    fallbacks = '"Times New Roman", "Playfair Display", "Georgia", "DejaVu Serif", serif';
  } else if (cleanFamily.includes("verdana")) {
    fallbacks = '"Verdana", "Roboto", "DejaVu Sans", sans-serif';
  }

  const prefix = `${italic ? "italic " : ""}${bold ? "bold " : ""}`;
  return `${prefix}${fontSize}px ${fallbacks}`;
};

export interface BackgroundConfig {
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  lockAspectRatio?: boolean;
  fitMode?: "cover" | "contain" | "stretch" | "custom";
  opacity?: number;
}

export interface CertSigner {
  name: string;
  title?: string;
  role?: string;
  nip?: string;
  institution?: string;
  signatureUrl?: string;
}

export interface CertCompetencyUnit {
  code: string;
  title: string;
  standard?: string;
  result?: string;
  score?: number;
}

export interface CertData {
  name: string;
  courseName: string;
  majority: string;
  program: string;
  certId: string;
  certificateNumber?: string;
  schoolName?: string;
  issuedAt: string;
  issuerId: string;
  studentId: string;
  instructorName?: string;
  instructorNip?: string;
  instructorMajor?: string;
  signers?: CertSigner[];
  competencyUnits?: CertCompetencyUnit[];
  layoutMode?: "STANDARD" | "QR_ONLY";
  layout?: "HORIZONTAL" | "VERTICAL";
  paperSize?: "A4" | "F4" | "LETTER" | "CUSTOM" | string;
  paperWidthCm?: number;
  paperHeightCm?: number;
  customTemplatePath?: string;
  backgroundConfig?: BackgroundConfig;
  layoutConfig?: Record<string, any>;
}

// Fetch layout setting from database
const getLayoutSetting = async (): Promise<"HORIZONTAL" | "VERTICAL"> => {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "certificate_layout" },
    });
    return (setting?.value as "HORIZONTAL" | "VERTICAL") || "HORIZONTAL";
  } catch (err) {
    return "HORIZONTAL";
  }
};

// Fetch paper size setting from database
const getPaperSizeSetting = async (): Promise<string> => {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "certificate_paper_size" },
    });
    return setting?.value || "A4";
  } catch (err) {
    return "A4";
  }
};

// Standard DPI and paper size dimensions
const DPI = 150;
const CM_TO_PX = DPI / 2.54; // ~59.055118 px/cm

const PAPER_PRESETS_CM: Record<string, { width: number; height: number }> = {
  A4: { width: 29.7, height: 21.0 }, // Landscape
  F4: { width: 33.0, height: 21.5 },
  LETTER: { width: 27.94, height: 21.59 },
};

// Helper to draw the procedural grid, borders, and neon corner accents
const drawDefaultBackground = (
  ctx: any,
  width: number,
  height: number,
  isVertical: boolean
) => {
  // Deep dark blue/black background #020617 (Slate 950)
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  // Gradient Background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0f172a"); // Slate 900
  gradient.addColorStop(1, "#172554"); // Blue 950
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Grid Pattern (Subtle)
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer Border
  ctx.strokeStyle = "#0ea5e9"; // Sky 500
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Inner Border (Glow)
  ctx.shadowColor = "#06b6d4";
  ctx.shadowBlur = 15;
  ctx.strokeStyle = "#22d3ee"; // Cyan 400
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, width - 120, height - 120);
  ctx.shadowBlur = 0;

  // Corner Accents (Hexagon aesthetic)
  const drawCorner = (x: number, y: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, 0, 100, 10);
    ctx.fillRect(0, 0, 10, 100);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(10, 10, 20, 20);
    ctx.restore();
  };

  drawCorner(40, 40, 0); // Top Left
  drawCorner(width - 40, 40, Math.PI / 2); // Top Right
  drawCorner(width - 40, height - 40, Math.PI); // Bottom Right
  drawCorner(40, height - 40, -Math.PI / 2); // Bottom Left
};

export const generateCertificateImage = async (
  data: CertData
): Promise<Buffer> => {
  // Resolve layout and paper size settings
  const activeLayout = data.layout || (await getLayoutSetting());
  const activePaperSize = data.paperSize || (await getPaperSizeSetting());
  const isVertical = activeLayout === "VERTICAL";

  // Calculate dimensions from float cm size or presets
  let widthCm = data.paperWidthCm || data.layoutConfig?.paperWidthCm;
  let heightCm = data.paperHeightCm || data.layoutConfig?.paperHeightCm;

  if (!widthCm || !heightCm) {
    const preset = PAPER_PRESETS_CM[activePaperSize.toUpperCase()] || PAPER_PRESETS_CM.A4;
    widthCm = preset.width;
    heightCm = preset.height;
  }

  // Adjust for orientation
  let finalWidthCm = widthCm;
  let finalHeightCm = heightCm;
  if (isVertical && finalWidthCm > finalHeightCm) {
    finalWidthCm = heightCm;
    finalHeightCm = widthCm;
  } else if (!isVertical && finalWidthCm < finalHeightCm) {
    finalWidthCm = heightCm;
    finalHeightCm = widthCm;
  }

  const width = Math.round(finalWidthCm * CM_TO_PX);
  const height = Math.round(finalHeightCm * CM_TO_PX);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Clip strictly to canvas bounds so nothing can bleed/overflow outside the canvas
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  // Fill canvas base rectangle (default dark #020617 or custom canvasBgColor)
  const canvasBg = (data.layoutConfig as any)?.canvasBgColor || (data.layoutConfig as any)?.backgroundConfig?.canvasBgColor || "#020617";
  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, width, height);

  const centerX = width / 2;

  // Resolve dynamic instructor details
  let finalInstructorName = data.instructorName;
  let finalInstructorNip = data.instructorNip;
  let finalInstructorMajor = data.instructorMajor || "Teknologi Informasi";

  if (!finalInstructorName || finalInstructorName === "Head Instructor" || finalInstructorName === "Instructor Name") {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: "default_certificate_instructor_name" }
      });
      finalInstructorName = setting?.value || "Budi Headmaster, M.T.";
    } catch (e) {
      finalInstructorName = "Budi Headmaster, M.T.";
    }
  }

  if (!finalInstructorNip || finalInstructorNip === "-") {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: "default_certificate_instructor_nip" }
      });
      finalInstructorNip = setting?.value || "198706152010121002";
    } catch (e) {
      finalInstructorNip = "198706152010121002";
    }
  }

  // --- 1. DRAW BACKGROUND (CUSTOM OR DEFAULT) ---
  let customImg = null;
  let activeTemplatePath = data.customTemplatePath;
  if (!activeTemplatePath) {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: "default_certificate_template" },
      });
      if (setting?.value) {
        activeTemplatePath = path.isAbsolute(setting.value)
          ? setting.value
          : path.join(process.cwd(), setting.value);
      }
    } catch (err) {
      console.error("[imageGenerator] Failed to fetch default template path:", err);
    }
  }

  if (activeTemplatePath) {
    try {
      let templatePath = activeTemplatePath;
      const isCid = templatePath.startsWith("Qm") && templatePath.length >= 46;
      if (isCid) {
        // Resolve using local/remote IPFS gateway
        const gateway = process.env.IPFS_GATEWAY || "http://127.0.0.1:8082";
        templatePath = `${gateway}/ipfs/${templatePath}`;
        console.log(`[imageGenerator] Resolved IPFS CID custom template: ${templatePath}`);
      }

      if (
        templatePath.startsWith("http://") ||
        templatePath.startsWith("https://")
      ) {
        console.log(`[imageGenerator] Fetching remote template image: ${templatePath}`);
        const response = await axios.get(templatePath, {
          responseType: "arraybuffer",
          timeout: 10000,
        });
        const buffer = Buffer.from(response.data);
        customImg = await loadImage(buffer);
      } else if (templatePath.startsWith("data:image/")) {
        customImg = await loadImage(templatePath);
      } else if (fs.existsSync(templatePath)) {
        customImg = await loadImage(templatePath);
      }
    } catch (err: any) {
      console.warn("⚠️ Failed to load custom template:", err.message);
    }
  }

  const bgConfig: BackgroundConfig = data.backgroundConfig || data.layoutConfig?.backgroundConfig || {};

  if (customImg) {
    ctx.save();
    if (bgConfig.opacity !== undefined && bgConfig.opacity < 100) {
      ctx.globalAlpha = Math.max(0, Math.min(1, bgConfig.opacity / 100));
    }

    const rawConfig = data.layoutConfig;
    const elements = (rawConfig && rawConfig.elements) ? rawConfig.elements : rawConfig;
    const bgElement = elements?.background;

    if (bgElement && (bgElement.width || bgElement.height || bgElement.x !== undefined)) {
      const drawWidth = bgElement.width || width;
      const drawHeight = bgElement.height || height;
      const drawX = (bgElement.x !== undefined ? bgElement.x : width / 2) - drawWidth / 2;
      const drawY = (bgElement.y !== undefined ? bgElement.y : height / 2) - drawHeight / 2;
      ctx.drawImage(customImg, drawX, drawY, drawWidth, drawHeight);
    } else {
      const fitMode = bgConfig.fitMode || "custom";
      if (fitMode === "stretch") {
        ctx.drawImage(customImg, 0, 0, width, height);
      } else if (fitMode === "cover") {
        const imgRatio = customImg.width / customImg.height;
        const canvasRatio = width / height;
        let renderW = width;
        let renderH = height;
        let renderX = 0;
        let renderY = 0;
        if (imgRatio > canvasRatio) {
          renderW = height * imgRatio;
          renderX = (width - renderW) / 2;
        } else {
          renderH = width / imgRatio;
          renderY = (height - renderH) / 2;
        }
        ctx.drawImage(customImg, renderX, renderY, renderW, renderH);
      } else if (fitMode === "contain") {
        const imgRatio = customImg.width / customImg.height;
        const canvasRatio = width / height;
        let renderW = width;
        let renderH = height;
        let renderX = 0;
        let renderY = 0;
        if (imgRatio > canvasRatio) {
          renderH = width / imgRatio;
          renderY = (height - renderH) / 2;
        } else {
          renderW = height * imgRatio;
          renderX = (width - renderW) / 2;
        }
        ctx.drawImage(customImg, renderX, renderY, renderW, renderH);
      } else {
        // "custom" mode using scaleX, scaleY, offsetX, offsetY
        const scaleX = (bgConfig.scaleX !== undefined ? bgConfig.scaleX : 100) / 100;
        const scaleY = (bgConfig.scaleY !== undefined ? bgConfig.scaleY : 100) / 100;
        const drawWidth = width * scaleX;
        const drawHeight = height * scaleY;
        const offsetX = bgConfig.offsetX || 0;
        const offsetY = bgConfig.offsetY || 0;
        const drawX = (width - drawWidth) / 2 + offsetX;
        const drawY = (height - drawHeight) / 2 + offsetY;
        ctx.drawImage(customImg, drawX, drawY, drawWidth, drawHeight);
      }
    }
    ctx.restore();
  } else if (
    (data.layoutConfig as any)?.followTemplateDesign !== false &&
    (data.layoutConfig as any)?.showDecorativeFrame !== false
  ) {
    drawDefaultBackground(ctx, width, height, isVertical);
  } else {
    // Pure clean canvas background without neon borders/grid
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, width, height);
  }

  // --- 2. DYNAMIC METADATA & VARIABLE LAYERS ---
  const rawConfig = data.layoutConfig;
  const elements = (rawConfig && rawConfig.elements) ? rawConfig.elements : rawConfig;
  const followTemplateDesign = (rawConfig as any)?.followTemplateDesign !== false;

  if (elements && Object.keys(elements).length > 0) {
    // --- 2A. CUSTOM LAYOUT OVERLAYS (STRICT VISIBILITY & WYSIWYG) ---

    const s1 = data.signers && data.signers[0];
    const s2 = data.signers && data.signers[1];
    const s3 = data.signers && data.signers[2];

    // Dynamic value mapping for variables
    const dynamicValues: Record<string, string> = {
      universityTitle: "UNIVERSITAS NEGERI SURABAYA",
      certificateTitle: "SERTIFIKAT UJI KOMPETENSI KEAHLIAN",
      certIdLabel: `ID: ${data.certId}`,
      certificateNumber: data.certificateNumber ? `No: ${data.certificateNumber}` : `No: UKK/${data.certId.substring(0, 8).toUpperCase()}`,
      presentedTo: "PROUDLY PRESENTED TO",
      studentName: data.name,
      schoolName: data.schoolName || "",
      majorProgram: `${(data.majority || "Major").toUpperCase()} - ${(data.program || "Level").toUpperCase()}`,
      studentId: `NISN / ID : ${data.studentId}`,
      courseSubtitle: "For successfully completing the competency assessment:",
      courseTitle: data.courseName || "Blockchain Course",
      instructorName: finalInstructorName,
      instructorTitle: (finalInstructorMajor || "HEAD INSTRUCTOR").toUpperCase(),
      instructorNip: `Instructor ID: ${finalInstructorNip}`,
      // Dynamic Multi-Signers
      signer1Name: s1?.name || finalInstructorName,
      signer1Title: (s1?.title || "KEPALA SEKOLAH / PENGUJI").toUpperCase(),
      signer1Nip: s1?.nip ? `NIP: ${s1.nip}` : (finalInstructorNip ? `NIP: ${finalInstructorNip}` : ""),
      signer2Name: s2?.name || "ASESOR PENGUJI EKSTERNAL",
      signer2Title: (s2?.title || "MITRA INDUSTRI (DUDI)").toUpperCase(),
      signer2Nip: s2?.institution || (s2?.nip ? `NIP: ${s2.nip}` : ""),
      signer3Name: s3?.name || "",
      signer3Title: (s3?.title || "").toUpperCase(),
      signer3Nip: s3?.nip ? `NIP: ${s3.nip}` : (s3?.institution || ""),
      issuedDateTitle: "DATE ISSUED",
      issuedDateBox: data.issuedAt,
      scanToVerifyLabel: "SCAN TO VERIFY",
    };

    const isQrOnly = data.layoutMode === "QR_ONLY" || (rawConfig as any)?.layoutMode === "QR_ONLY";

    // Helper to draw text element
    const drawTextElement = (key: string, el: any) => {
      if (!el || el.visible === false) return;
      const text = dynamicValues[key] !== undefined ? dynamicValues[key] : (el.text || "");
      if (!text) return;

      ctx.save();
      ctx.textAlign = el.align || "left";
      ctx.textBaseline = "top";

      const style = resolveCanvasFont(
        el.fontFamily || "Arial",
        el.fontSize || 24,
        !!el.bold,
        !!el.italic
      );
      ctx.font = style;

      // Special background pill for presentedTo (hanya jika followTemplateDesign aktif)
      if (followTemplateDesign && key === "presentedTo") {
        const textWidth = ctx.measureText(text).width;
        const paddingX = 24;
        const paddingY = 12;
        const pillHeight = (el.fontSize || 18) + (paddingY * 2);
        const pillWidth = textWidth + (paddingX * 2);
        
        let x = el.x;
        if (el.align === "center") x = el.x - pillWidth / 2;
        if (el.align === "right") x = el.x - pillWidth;
        
        const y = el.y - paddingY;

        ctx.fillStyle = canvasBg === "#ffffff" ? "#f1f5f9" : "#0f172a";
        ctx.beginPath();
        ctx.roundRect(x, y, pillWidth, pillHeight, pillHeight / 2);
        ctx.fill();
        ctx.strokeStyle = canvasBg === "#ffffff" ? "#cbd5e1" : "#164e63";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Special background box for issuedDateBox (hanya jika followTemplateDesign aktif)
      if (followTemplateDesign && key === "issuedDateBox") {
        const textWidth = ctx.measureText(text).width;
        const paddingX = 24;
        const paddingY = 16;
        const boxHeight = (el.fontSize || 24) + (paddingY * 2);
        const boxWidth = textWidth + (paddingX * 2);
        
        let x = el.x;
        if (el.align === "center") x = el.x - boxWidth / 2;
        if (el.align === "right") x = el.x - boxWidth;
        
        const y = el.y - paddingY;

        ctx.fillStyle = canvasBg === "#ffffff" ? "#f1f5f9" : "#0f172a";
        ctx.beginPath();
        ctx.roundRect(x, y, boxWidth, boxHeight, 12);
        ctx.fill();
        ctx.strokeStyle = canvasBg === "#ffffff" ? "#cbd5e1" : "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Glow effect (jika diaktifkan atau default judul di dark mode)
      if (el.hasGlow) {
        ctx.shadowColor = el.glowColor || el.color || "#0891b2";
        ctx.shadowBlur = el.glowBlur || 15;
      } else {
        ctx.shadowBlur = 0;
      }

      // Text color (Gradient vs Solid)
      if (el.colorMode === "gradient") {
        const textWidth = ctx.measureText(text).width;
        let startX = el.x;
        if (el.align === "center") startX = el.x - textWidth / 2;
        else if (el.align === "right") startX = el.x - textWidth;

        const grad = ctx.createLinearGradient(startX, el.y, startX + textWidth, el.y);
        grad.addColorStop(0, el.color || "#ffffff");
        grad.addColorStop(1, el.gradientColor2 || "#38bdf8");
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = el.color || "#ffffff";
      }

      ctx.fillText(text, el.x, el.y);
      ctx.restore();
    };

    // Helper to draw shape element (Persegi, Kotak Bulat, Lingkaran, Badge)
    const drawShapeElement = (key: string, el: any) => {
      if (!el || el.visible === false) return;
      const w = el.width || 200;
      const h = el.height || 100;
      const x = el.x - w / 2;
      const y = el.y - h / 2;

      ctx.save();
      if (el.opacity !== undefined && el.opacity < 100) {
        ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity / 100));
      }

      ctx.beginPath();
      const shapeType = el.shapeType || "rectangle";
      if (shapeType === "circle") {
        const r = Math.min(w, h) / 2;
        ctx.arc(el.x, el.y, r, 0, Math.PI * 2);
      } else if (shapeType === "rounded-rect" || shapeType === "badge") {
        const r = shapeType === "badge" ? h / 2 : (el.borderRadius !== undefined ? el.borderRadius : 16);
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }

      if (el.fillType !== "none") {
        if (el.fillType === "gradient") {
          const grad = ctx.createLinearGradient(x, y, x + w, y + h);
          grad.addColorStop(0, el.color || "#ffffff");
          grad.addColorStop(1, el.gradientColor2 || "#38bdf8");
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = el.color || "rgba(255,255,255,0.08)";
        }
        ctx.fill();
      }

      if (el.borderWidth && el.borderWidth > 0) {
        ctx.strokeStyle = el.borderColor || "#38bdf8";
        ctx.lineWidth = el.borderWidth;
        ctx.stroke();
      }

      ctx.restore();
    };

    // Helper to draw image element
    const drawImageElement = async (key: string, el: any) => {
      if (!el || el.visible === false) return;

      if (key === "qrCode" || el.id === "qrCode") {
        const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${data.certId}`;
        const qrWidth = el.width || 150;
        const qrHeight = el.height || 150;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: qrWidth,
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
        const qrImage = await loadImage(qrDataUrl);
        const qx = el.x - qrWidth / 2;
        const qy = el.y - qrHeight / 2;
        
        ctx.save();
        if (el.hasGlow) {
          ctx.shadowColor = el.glowColor || "#38bdf8";
          ctx.shadowBlur = el.glowBlur || 15;
        } else {
          ctx.shadowBlur = 0;
        }
        if (el.opacity !== undefined) {
          ctx.globalAlpha = el.opacity / 100;
        }
        ctx.drawImage(qrImage, qx, qy, qrWidth, qrHeight);
        ctx.restore();
        return;
      }

      // University Logo or Custom Uploaded Image Layer
      try {
        let imgSource = el.imageUrl || el.src;
        if (
          !imgSource ||
          imgSource === "DEFAULT_LOGO" ||
          imgSource === "/assets/unesa-logo.png" ||
          imgSource.includes("unesa-logo.png") ||
          key === "universityLogo"
        ) {
          const possiblePaths = [
            path.join(process.cwd(), "assets", "unesa-logo.png"),
            path.resolve(__dirname, "../../assets/unesa-logo.png"),
            path.resolve(__dirname, "../assets/unesa-logo.png"),
            path.resolve(__dirname, "../../../assets/unesa-logo.png"),
            path.join(process.cwd(), "../frontend/public/assets/unesa-logo.png"),
          ];
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              imgSource = p;
              break;
            }
          }
        } else if (imgSource.startsWith("/uploads/")) {
          imgSource = path.join(process.cwd(), imgSource);
        }

        let loadedImg = null;
        if (imgSource.startsWith("http://") || imgSource.startsWith("https://")) {
          const resp = await axios.get(imgSource, { responseType: "arraybuffer", timeout: 10000 });
          loadedImg = await loadImage(Buffer.from(resp.data));
        } else if (imgSource.startsWith("data:image/")) {
          loadedImg = await loadImage(imgSource);
        } else if (fs.existsSync(imgSource)) {
          loadedImg = await loadImage(imgSource);
        }

        if (loadedImg) {
          ctx.save();
          if (el.opacity !== undefined && el.opacity < 100) {
            ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity / 100));
          }
          const imgW = el.width || 120;
          const imgH = el.height || 120;
          const imgX = el.x - imgW / 2;
          const imgY = el.y - imgH / 2;
          ctx.drawImage(loadedImg, imgX, imgY, imgW, imgH);
          ctx.restore();
        }
      } catch (err: any) {
        console.warn(`⚠️ Failed to load image layer ${key}:`, err.message);
      }
    };

    // Helper to draw line element
    const drawLineElement = (key: string, el: any) => {
      if (!el || el.visible === false) return;
      ctx.save();
      ctx.strokeStyle = el.color || "#334155";
      ctx.lineWidth = el.height || 2;
      ctx.beginPath();
      const lineW = el.width || 240;
      ctx.moveTo(el.x - lineW / 2, el.y);
      ctx.lineTo(el.x + lineW / 2, el.y);
      ctx.stroke();
      ctx.restore();
    };

    // Render all elements in layout config in ascending zIndex order
    const sortedEntries = (Object.entries(elements) as [string, any][])
      .filter(([key, el]) => {
        if (!el || el.visible === false) return false;
        if (isQrOnly) {
          // In QR-Only mode, only render QR code and explicitly custom-added elements
          return key === "qrCode" || el.isCustom === true;
        }
        return true;
      })
      .sort((a, b) => (a[1].zIndex || 0) - (b[1].zIndex || 0));

    for (const [key, el] of sortedEntries) {
      if (key === "background") continue; // Background handled in section 1
      if (el.type === "text") {
        drawTextElement(key, el);
      } else if (el.type === "shape") {
        drawShapeElement(key, el);
      } else if (el.type === "image") {
        await drawImageElement(key, el);
      } else if (el.type === "line") {
        drawLineElement(key, el);
      }
    }
  } else {
    // --- 2B. DYNAMIC METADATA OVERLAYS (FALLBACK WHEN NO LAYOUT CONFIG) ---
    // Draw default logo
    const logoPath = path.resolve(__dirname, "../../assets/unesa-logo.png");
    const logoSize = 120;
    const logoY = isVertical ? 150 : 100;
    try {
      const logoImage = await loadImage(logoPath);
      ctx.drawImage(logoImage, centerX - logoSize / 2, logoY, logoSize, logoSize);
    } catch (err) {
      ctx.beginPath();
      ctx.arc(centerX, logoY + logoSize / 2, 50, 0, Math.PI * 2);
      ctx.fillStyle = "#334155";
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.stroke();
    }

    // University Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = resolveCanvasFont("Arial", 24, true, false);
    ctx.fillText("UNIVERSITAS NEGERI SURABAYA", centerX, logoY + logoSize + 40);

    if (isVertical) {
      // Certificate Title
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#f0f9ff"; // Sky 50
      ctx.font = resolveCanvasFont("Arial", 56, true, false);
      ctx.fillText("CERTIFICATE OF", centerX, 480);
      ctx.fillText("COMPLETION", centerX, 550);
      ctx.shadowBlur = 0;

      // "Proudly Presented To"
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = resolveCanvasFont("Arial", 24, false, true);
      ctx.fillText("Proudly Presented To", centerX, 680);

      // Student Name
      ctx.shadowColor = "#e879f9"; // Fuchsia glow
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#fae8ff"; // Fuchsia 50
      ctx.font = resolveCanvasFont("Arial", 64, true, false);
      ctx.fillText(data.name, centerX, 780);
      ctx.shadowBlur = 0;

      // Divider Line
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 250, 820);
      ctx.lineTo(centerX + 250, 820);
      ctx.stroke();

      // Major / Program
      ctx.fillStyle = "#e2e8f0"; // Slate 200
      ctx.font = resolveCanvasFont("Arial", 20, true, false);
      ctx.fillText(
        `${(data.majority || "Major").toUpperCase()} - ${(data.program || "Level").toUpperCase()}`,
        centerX,
        860
      );

      // Student User ID
      ctx.fillStyle = "#67e8f9"; // Cyan 300
      ctx.font = resolveCanvasFont("Arial", 20, true, false);
      ctx.fillText(`Student ID : ${data.studentId}`, centerX, 900);

      // "For successfully completing..."
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = resolveCanvasFont("Arial", 20, false, true);
      ctx.fillText("For successfully completing the course:", centerX, 1020);

      // Course Title
      ctx.fillStyle = "#e0f2fe"; // Sky 100
      ctx.font = resolveCanvasFont("Arial", 44, true, false);
      ctx.fillText(data.courseName || "Blockchain Course", centerX, 1090);

      // Footer - Instructor (Y=1450)
      const footerY = 1450;
      const leftX = 280;
      ctx.fillStyle = "#f8fafc";
      ctx.font = resolveCanvasFont("Arial", 24, true, true);
      ctx.fillText(finalInstructorName, leftX, footerY - 50);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX - 120, footerY - 40);
      ctx.lineTo(leftX + 120, footerY - 40);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = resolveCanvasFont("Arial", 14, true, false);
      ctx.fillText((finalInstructorMajor || "HEAD INSTRUCTOR").toUpperCase(), leftX, footerY - 10);
      ctx.fillStyle = "#38bdf8";
      ctx.font = resolveCanvasFont("Courier New", 14, false, false);
      ctx.fillText(`Instructor ID: ${finalInstructorNip}`, leftX, footerY + 15);

      // Footer - QR Code (Y=1450, Right)
      const rightX = width - 280;
      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${data.certId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      const qrImage = await loadImage(qrDataUrl);
      ctx.drawImage(qrImage, rightX - 70, footerY - 100, 140, 140);

      ctx.fillStyle = "#0ea5e9";
      ctx.font = resolveCanvasFont("Arial", 12, true, false);
      ctx.fillText("SCAN TO VERIFY", rightX, footerY + 60);

      // Dynamic Hash / Details
      ctx.fillStyle = "#64748b";
      ctx.font = resolveCanvasFont("Arial", 14, false, false);
      ctx.fillText(`Certificate ID: ${data.certId}`, centerX, height - 120);
      ctx.fillText(`Issued: ${data.issuedAt}`, centerX, height - 90);

    } else {
      // Horizontal Layout Placement (Original)
      // Certificate Title
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#f0f9ff"; // Sky 50
      ctx.font = resolveCanvasFont("Arial", 80, true, false);
      ctx.fillText("CERTIFICATE OF", centerX, 360);
      ctx.fillText("COMPLETION", centerX, 450);
      ctx.shadowBlur = 0;

      // "Proudly Presented To"
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = resolveCanvasFont("Arial", 24, false, true);
      ctx.fillText("Proudly Presented To", centerX, 520);

      // Student Name
      ctx.shadowColor = "#e879f9";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#fae8ff";
      ctx.font = resolveCanvasFont("Arial", 90, true, false);
      ctx.fillText(data.name, centerX, 620);
      ctx.shadowBlur = 0;

      // Divider Line
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 300, 650);
      ctx.lineTo(centerX + 300, 650);
      ctx.stroke();

      // Major / Program
      ctx.fillStyle = "#e2e8f0";
      ctx.font = resolveCanvasFont("Arial", 22, true, false);
      ctx.fillText(
        `${(data.majority || "Major").toUpperCase()} - ${(data.program || "Level").toUpperCase()}`,
        centerX,
        690
      );

      // Student User ID
      ctx.fillStyle = "#67e8f9";
      ctx.font = resolveCanvasFont("Arial", 20, false, false);
      ctx.fillText(`Student ID : ${data.studentId}`, centerX, 725);

      // "For successfully completing..."
      ctx.fillStyle = "#94a3b8";
      ctx.font = resolveCanvasFont("Arial", 20, false, true);
      ctx.fillText("For successfully completing the course:", centerX, 780);

      // Course Title
      ctx.fillStyle = "#e0f2fe";
      ctx.font = resolveCanvasFont("Arial", 50, true, false);
      ctx.fillText(data.courseName || "Blockchain Course", centerX, 820);

      // Footer - Instructor (Left)
      const footerY = height - 120;
      const leftX = 350;
      ctx.fillStyle = "#f8fafc";
      ctx.font = resolveCanvasFont("Arial", 28, true, true);
      ctx.fillText(finalInstructorName, leftX, footerY - 50);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX - 120, footerY - 40);
      ctx.lineTo(leftX + 120, footerY - 40);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = resolveCanvasFont("Arial", 16, true, false);
      ctx.fillText((finalInstructorMajor || "HEAD INSTRUCTOR").toUpperCase(), leftX, footerY - 10);
      ctx.fillStyle = "#38bdf8";
      ctx.font = resolveCanvasFont("Courier New", 14, false, false);
      ctx.fillText(`Instructor ID: ${finalInstructorNip}`, leftX, footerY + 15);

      // Middle Info (ID and Date)
      ctx.fillStyle = "#64748b";
      ctx.font = resolveCanvasFont("Arial", 14, false, false);
      ctx.fillText(`ID: ${data.certId}`, centerX, height - 60);
      ctx.fillText(`Issued: ${data.issuedAt}`, centerX, height - 40);

      // Footer - QR Code (Right)
      const rightX = width - 350;
      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${data.certId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 150,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      const qrImage = await loadImage(qrDataUrl);
      ctx.drawImage(qrImage, rightX - 75, footerY - 100, 150, 150);

      ctx.fillStyle = "#0ea5e9";
      ctx.font = resolveCanvasFont("Arial", 12, true, false);
      ctx.fillText("SCAN TO VERIFY", rightX, footerY + 70);
    }
  }

  return canvas.toBuffer("image/png");
};

/**
 * Generates the Back Page (Page 2) - High Fidelity SKKNI Competency Transcript Table
 */
export const generateCertificateTranscriptCanvas = async (data: CertData): Promise<Buffer> => {
  // Determine layout and dimensions
  const isVertical = data.layout === "VERTICAL";
  const paperPreset = PAPER_PRESETS_CM[data.paperSize || "A4"] || PAPER_PRESETS_CM.A4;
  const widthCm = isVertical ? paperPreset.height : paperPreset.width;
  const heightCm = isVertical ? paperPreset.width : paperPreset.height;

  const width = Math.round(widthCm * CM_TO_PX);
  const height = Math.round(heightCm * CM_TO_PX);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Clean Crisp White Paper
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Elegant Border
  ctx.strokeStyle = "#0f172a"; // Slate 900
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.strokeStyle = "#94a3b8"; // Slate 400
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Header Title
  const centerX = width / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = "#0f172a";
  ctx.font = resolveCanvasFont("Arial", 26, true, false);
  ctx.fillText("DAFTAR UNIT KOMPETENSI / TRANSKRIP HASIL UJI", centerX, 70);

  ctx.fillStyle = "#475569";
  ctx.font = resolveCanvasFont("Arial", 14, false, true);
  ctx.fillText("List of Competency Unit Standards & Official Assessment Results", centerX, 105);

  // Divider Line
  ctx.strokeStyle = "#0284c7"; // Sky 600
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 250, 130);
  ctx.lineTo(centerX + 250, 130);
  ctx.stroke();

  // Participant Info Card Box
  const infoX = 70;
  const infoY = 150;
  const infoW = width - 140;
  const infoH = 110;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(infoX, infoY, infoW, infoH);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.strokeRect(infoX, infoY, infoW, infoH);

  // 2-Column Info Data
  ctx.textAlign = "left";
  ctx.font = resolveCanvasFont("Arial", 13, true, false);
  ctx.fillStyle = "#334155";

  const col1X = infoX + 25;
  const col2X = centerX + 20;
  let curY = infoY + 16;

  // Left Column
  ctx.fillText("Nama Peserta", col1X, curY);
  ctx.fillText(`:  ${data.name.toUpperCase()}`, col1X + 130, curY);

  ctx.fillText("NISN / ID Siswa", col1X, curY + 30);
  ctx.fillText(`:  ${data.studentId}`, col1X + 130, curY + 30);

  ctx.fillText("Asal Sekolah", col1X, curY + 60);
  ctx.fillText(`:  ${data.schoolName || "SMK NEGERI 1 SURABAYA"}`, col1X + 130, curY + 60);

  // Right Column
  ctx.fillText("Program Keahlian", col2X, curY);
  ctx.fillText(`:  ${data.majority || "Teknik"} - ${data.program || "RPL"}`, col2X + 150, curY);

  ctx.fillText("No. Sertifikat", col2X, curY + 30);
  ctx.fillText(`:  ${data.certificateNumber || `UKK/${data.certId.substring(0, 8).toUpperCase()}`}`, col2X + 150, curY + 30);

  ctx.fillText("Tanggal Terbit", col2X, curY + 60);
  ctx.fillText(`:  ${data.issuedAt}`, col2X + 150, curY + 60);

  // Table Structure
  const tableX = 70;
  const tableY = 280;
  const tableW = width - 140;
  const rowHeight = 36;

  // Column Widths: No (50), Kode (180), Judul (Flex), Standar (110), Hasil (130)
  const colNoW = 55;
  const colCodeW = 200;
  const colStdW = 120;
  const colResW = 140;
  const colTitleW = tableW - (colNoW + colCodeW + colStdW + colResW);

  // Table Header Fill
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(tableX, tableY, tableW, 40);

  ctx.fillStyle = "#ffffff";
  ctx.font = resolveCanvasFont("Arial", 13, true, false);
  ctx.textAlign = "center";

  ctx.fillText("NO", tableX + colNoW / 2, tableY + 12);
  ctx.fillText("KODE UNIT SKKNI", tableX + colNoW + colCodeW / 2, tableY + 12);
  ctx.textAlign = "left";
  ctx.fillText("JUDUL UNIT KOMPETENSI", tableX + colNoW + colCodeW + 15, tableY + 12);
  ctx.textAlign = "center";
  ctx.fillText("STANDAR", tableX + colNoW + colCodeW + colTitleW + colStdW / 2, tableY + 12);
  ctx.fillText("PENCAPAIAN", tableX + tableW - colResW / 2, tableY + 12);

  // Competency Units Data (Fallback to realistic default units if none provided)
  const defaultUnits: CertCompetencyUnit[] = [
    { code: "J.620100.004.01", title: "Menerapkan Pemrograman Berorientasi Objek (OOP)", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.009.02", title: "Menggunakan Struktur Data dan Algoritma Dasar", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.017.02", title: "Mengimplementasikan Basis Data Relasional (SQL/PostgreSQL)", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.025.02", title: "Melakukan Pengujian Perangkat Lunak (Software Unit Testing)", standard: "SKKNI", result: "KOMPETEN" },
    { code: "J.620100.033.02", title: "Mengembangkan Arsitektur API dan Smart Contract Terdistribusi", standard: "SKKNI", result: "KOMPETEN" },
  ];

  const units = (data.competencyUnits && data.competencyUnits.length > 0)
    ? data.competencyUnits
    : defaultUnits;

  let tableRowY = tableY + 40;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#cbd5e1";

  units.forEach((unit, idx) => {
    const isEven = idx % 2 === 1;
    if (isEven) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(tableX, tableRowY, tableW, rowHeight);
    }

    // Row borders
    ctx.strokeRect(tableX, tableRowY, tableW, rowHeight);
    ctx.strokeRect(tableX, tableRowY, colNoW, rowHeight);
    ctx.strokeRect(tableX + colNoW, tableRowY, colCodeW, rowHeight);
    ctx.strokeRect(tableX + colNoW + colCodeW, tableRowY, colTitleW, rowHeight);
    ctx.strokeRect(tableX + colNoW + colCodeW + colTitleW, tableRowY, colStdW, rowHeight);

    // Text Values
    ctx.fillStyle = "#0f172a";
    ctx.font = resolveCanvasFont("Arial", 12, false, false);

    // No
    ctx.textAlign = "center";
    ctx.fillText(`${idx + 1}`, tableX + colNoW / 2, tableRowY + 11);

    // Kode Unit
    ctx.font = resolveCanvasFont("Courier New", 12, true, false);
    ctx.fillText(unit.code, tableX + colNoW + colCodeW / 2, tableRowY + 11);

    // Judul Unit
    ctx.font = resolveCanvasFont("Arial", 12, false, false);
    ctx.textAlign = "left";
    let titleText = unit.title;
    if (ctx.measureText(titleText).width > colTitleW - 30) {
      titleText = titleText.substring(0, 55) + "...";
    }
    ctx.fillText(titleText, tableX + colNoW + colCodeW + 15, tableRowY + 11);

    // Standar
    ctx.textAlign = "center";
    ctx.fillText(unit.standard || "SKKNI", tableX + colNoW + colCodeW + colTitleW + colStdW / 2, tableRowY + 11);

    // Hasil (Green Badge Text)
    ctx.fillStyle = "#15803d"; // Green 700
    ctx.font = resolveCanvasFont("Arial", 12, true, false);
    ctx.fillText(unit.result || "KOMPETEN", tableX + tableW - colResW / 2, tableRowY + 11);

    tableRowY += rowHeight;
  });

  // Summary Row (Nilai Akhir)
  const summaryH = 38;
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(tableX, tableRowY, tableW, summaryH);
  ctx.strokeStyle = "#94a3b8";
  ctx.strokeRect(tableX, tableRowY, tableW, summaryH);

  ctx.fillStyle = "#0f172a";
  ctx.font = resolveCanvasFont("Arial", 13, true, false);
  ctx.textAlign = "left";
  ctx.fillText("HASIL AKHIR UJI KOMPETENSI KEAHLIAN", tableX + 25, tableRowY + 11);

  ctx.textAlign = "right";
  ctx.fillStyle = "#0369a1"; // Sky 700
  ctx.fillText("STATUS : SANGAT BAIK (KOMPETEN)", tableX + tableW - 25, tableRowY + 11);

  // Dual Signers Footer
  const footerY = height - 190;
  const s1 = data.signers && data.signers[0];
  const s2 = data.signers && data.signers[1];

  const leftSignerX = 260;
  const rightSignerX = width - 260;

  ctx.fillStyle = "#334155";
  ctx.font = resolveCanvasFont("Arial", 12, false, false);
  ctx.textAlign = "center";

  // Left Signer (Penguji Eksternal / Mitra DUDI)
  ctx.fillText("Penguji Eksternal / Asesor Industri (DUDI)", leftSignerX, footerY);
  ctx.fillText(s2?.institution || "PT. MITRA INDUSTRI INDONESIA", leftSignerX, footerY + 18);

  const leftSignerName = s2?.name || "ASESOR PENGUJI EKSTERNAL";
  ctx.font = resolveCanvasFont("Arial", 14, true, false);
  ctx.fillStyle = "#0f172a";
  ctx.fillText(leftSignerName, leftSignerX, footerY + 100);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftSignerX - 120, footerY + 118);
  ctx.lineTo(leftSignerX + 120, footerY + 118);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = resolveCanvasFont("Arial", 11, false, false);
  ctx.fillText(s2?.nip ? `NIP/REG: ${s2.nip}` : "ID REGISTRASI ASESOR", leftSignerX, footerY + 126);

  // Right Signer (Kepala Sekolah / Penguji Internal)
  ctx.font = resolveCanvasFont("Arial", 12, false, false);
  ctx.fillStyle = "#334155";
  ctx.fillText("Kepala Sekolah / Ketua Tim Penguji", rightSignerX, footerY);
  ctx.fillText(data.schoolName || "SMK NEGERI 1 SURABAYA", rightSignerX, footerY + 18);

  const rightSignerName = s1?.name || (data.instructorName || "KEPALA SEKOLAH / PENGUJI");
  ctx.font = resolveCanvasFont("Arial", 14, true, false);
  ctx.fillStyle = "#0f172a";
  ctx.fillText(rightSignerName, rightSignerX, footerY + 100);

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightSignerX - 120, footerY + 118);
  ctx.lineTo(rightSignerX + 120, footerY + 118);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = resolveCanvasFont("Arial", 11, false, false);
  ctx.fillText(s1?.nip ? `NIP: ${s1.nip}` : (data.instructorNip ? `NIP: ${data.instructorNip}` : "NIP: -"), rightSignerX, footerY + 126);

  return canvas.toBuffer("image/png");
};
