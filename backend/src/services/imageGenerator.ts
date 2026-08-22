import { createCanvas, loadImage } from "canvas";
import path from "path";
import * as QRCode from "qrcode";
import fs from "fs";
import axios from "axios";
import { db } from "../config/db";

export interface CertData {
  name: string;
  courseName: string;
  majority: string;
  program: string;
  certId: string;
  issuedAt: string;
  issuerId: string;
  studentId: string; // This will hold the User ID instead of NIM
  instructorName?: string;
  instructorNip?: string;
  instructorMajor?: string;
  layout?: "HORIZONTAL" | "VERTICAL";
  paperSize?: "A4" | "F4";
  customTemplatePath?: string;
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
const getPaperSizeSetting = async (): Promise<"A4" | "F4"> => {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "certificate_paper_size" },
    });
    return (setting?.value as "A4" | "F4") || "A4";
  } catch (err) {
    return "A4";
  }
};

// Paper size dimensions at 150 DPI (landscape width x height)
// A4: 210mm × 297mm → landscape: 1754 x 1240, portrait: 1240 x 1754
// F4: 215mm × 330mm → landscape: 1953 x 1272, portrait: 1272 x 1953
const PAPER_DIMENSIONS: Record<string, { landscape: [number, number]; portrait: [number, number] }> = {
  A4: { landscape: [1754, 1240], portrait: [1240, 1754] },
  F4: { landscape: [1953, 1272], portrait: [1272, 1953] },
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

  const dims = PAPER_DIMENSIONS[activePaperSize] || PAPER_DIMENSIONS["A4"];
  const [width, height] = isVertical ? dims.portrait : dims.landscape;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

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
      } else if (fs.existsSync(templatePath)) {
        customImg = await loadImage(templatePath);
      }
    } catch (err: any) {
      console.warn("⚠️ Failed to load custom template:", err.message);
    }
  }

  if (customImg) {
    ctx.drawImage(customImg, 0, 0, width, height);
  } else {
    drawDefaultBackground(ctx, width, height, isVertical);
  }

  // --- 2. LOGO & UNIVERSITY HEADER ---
  const logoPath = path.resolve(__dirname, "../../assets/unesa-logo.png");
  const logoSize = 120;
  const logoY = isVertical ? 150 : 100;
  try {
    const logoImage = await loadImage(logoPath);
    ctx.drawImage(logoImage, centerX - logoSize / 2, logoY, logoSize, logoSize);
  } catch (err) {
    // Fallback logo shape
    ctx.beginPath();
    ctx.arc(centerX, logoY + logoSize / 2, 50, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();
  }

  // University Title
  ctx.textAlign = "center";
  ctx.fillStyle = "#cbd5e1"; // Slate 300
  ctx.font = "bold 24px Arial";
  ctx.fillText("UNIVERSITAS NEGERI SURABAYA", centerX, logoY + logoSize + 40);

  // --- 3. DYNAMIC METADATA OVERLAYS ---
  if (data.layoutConfig && Object.keys(data.layoutConfig).length > 0) {
    // --- 3A. CUSTOM LAYOUT OVERLAYS ---
    const config = data.layoutConfig;
    ctx.textAlign = "center"; // default, config can override if we add align

    // Helper to draw text element
    const drawTextConfig = (key: string, text: string) => {
      const el = config[key];
      if (!el || !el.visible) return;
      ctx.textAlign = el.align || "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = el.color || "#ffffff";
      const style = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${el.fontSize || 24}px ${el.fontFamily || "Arial"}`;
      ctx.font = style;

      // Special background pill for presentedTo
      if (key === "presentedTo") {
        const textWidth = ctx.measureText(text).width;
        const paddingX = 24;
        const paddingY = 12;
        const height = el.fontSize + (paddingY * 2);
        const width = textWidth + (paddingX * 2);
        
        let x = el.x;
        if (el.align === "center") x = el.x - width / 2;
        if (el.align === "right") x = el.x - width;
        
        const y = el.y - paddingY;

        ctx.fillStyle = "#0f172a"; // slate-900
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, height / 2);
        ctx.fill();
        ctx.strokeStyle = "#164e63"; // cyan-900 border
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = el.color || "#ffffff";
      }

      // Special background box for issuedDateBox
      if (key === "issuedDateBox") {
        const textWidth = ctx.measureText(text).width;
        const paddingX = 24;
        const paddingY = 16;
        const height = el.fontSize + (paddingY * 2);
        const width = textWidth + (paddingX * 2);
        
        let x = el.x;
        if (el.align === "center") x = el.x - width / 2;
        if (el.align === "right") x = el.x - width;
        
        const y = el.y - paddingY;

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 12);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = el.color || "#ffffff";
      }

      // Special glows/gradients
      if (key === "certificateTitle") {
        ctx.shadowColor = "#0891b2";
        ctx.shadowBlur = 30;
      }
      
      if (key === "courseTitle") {
        ctx.shadowColor = "#0891b2";
        ctx.shadowBlur = 25;
      }

      if (key === "studentName") {
        // Gradient from cyan to pink
        const gradient = ctx.createLinearGradient(el.x - 200, 0, el.x + 200, 0);
        gradient.addColorStop(0, "#06b6d4"); // cyan
        gradient.addColorStop(1, "#f472b6"); // pink
        ctx.fillStyle = gradient;
        ctx.shadowColor = "#f472b6";
        ctx.shadowBlur = 20;
      }

      ctx.fillText(text, el.x, el.y);
      ctx.shadowBlur = 0; // reset shadow
    };

    drawTextConfig("universityTitle", "UNIVERSITAS NEGERI SURABAYA");
    drawTextConfig("certificateTitle", "CERTIFICATE OF COMPLETION");
    drawTextConfig("presentedTo", "PROUDLY PRESENTED TO");
    drawTextConfig("studentName", data.name);
    drawTextConfig("majorProgram", `${(data.majority || "Major").toUpperCase()} - ${(data.program || "Level").toUpperCase()}`);
    drawTextConfig("studentId", `Student ID : ${data.studentId}`);
    drawTextConfig("courseSubtitle", "For successfully completing the course:");
    drawTextConfig("courseTitle", data.courseName || "Blockchain Course");
    drawTextConfig("instructorName", finalInstructorName);
    drawTextConfig("instructorTitle", (finalInstructorMajor || "HEAD INSTRUCTOR").toUpperCase());
    drawTextConfig("instructorNip", `Instructor ID: ${finalInstructorNip}`);
    drawTextConfig("issuedDateTitle", "DATE ISSUED");
    drawTextConfig("issuedDateBox", data.issuedAt);
    drawTextConfig("certIdLabel", `ID: ${data.certId}`);
    drawTextConfig("scanToVerifyLabel", "SCAN TO VERIFY");

    // Lines & Images
    const drawDividerConfig = (key: string, width: number) => {
      const el = config[key];
      if (!el || !el.visible) return;
      ctx.strokeStyle = el.color || "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Assuming x, y is center and width is the line width
      ctx.moveTo(el.x - width / 2, el.y);
      ctx.lineTo(el.x + width / 2, el.y);
      ctx.stroke();
    };
    drawDividerConfig("dividerLine", 600);
    drawDividerConfig("instructorLine", 240);

    // QR Code
    const qrEl = config["qrCode"];
    if (qrEl && qrEl.visible) {
      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${data.certId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: qrEl.width || 150,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
      });
      const qrImage = await loadImage(qrDataUrl);
      const qx = qrEl.x - (qrEl.width || 150) / 2;
      const qy = qrEl.y - (qrEl.height || 150) / 2;
      
      // Neon glow behind QR code
      ctx.shadowColor = "#c026d3"; // fuchsia-600
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#000000"; // dark background to make qr readable
      ctx.fillRect(qx, qy, qrEl.width || 150, qrEl.height || 150);
      ctx.shadowBlur = 0;

      ctx.drawImage(qrImage, qx, qy, qrEl.width || 150, qrEl.height || 150);
    }
  } else {
    // --- 3B. DYNAMIC METADATA OVERLAYS (FALLBACK HARDCODED) ---
    if (isVertical) {
      // Vertical Layout Placement
      // Certificate Title
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#f0f9ff"; // Sky 50
      ctx.font = "bold 56px Arial";
      ctx.fillText("CERTIFICATE OF", centerX, 480);
      ctx.fillText("COMPLETION", centerX, 550);
      ctx.shadowBlur = 0;

      // "Proudly Presented To"
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = "italic 24px Arial";
      ctx.fillText("Proudly Presented To", centerX, 680);

      // Student Name
      ctx.shadowColor = "#e879f9"; // Fuchsia glow
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#fae8ff"; // Fuchsia 50
      ctx.font = "bold 64px Arial";
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
      ctx.font = "bold 20px Arial";
      ctx.fillText(
        `${(data.majority || "Major").toUpperCase()} - ${(data.program || "Level").toUpperCase()}`,
        centerX,
        860
      );

      // Student User ID
      ctx.fillStyle = "#67e8f9"; // Cyan 300
      ctx.font = "bold 20px Arial";
      ctx.fillText(`Student ID : ${data.studentId}`, centerX, 900);

      // "For successfully completing..."
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = "italic 20px Arial";
      ctx.fillText("For successfully completing the course:", centerX, 1020);

      // Course Title
      ctx.fillStyle = "#e0f2fe"; // Sky 100
      ctx.font = "bold 44px Arial";
      ctx.fillText(data.courseName || "Blockchain Course", centerX, 1090);

      // Footer - Instructor (Y=1450)
      const footerY = 1450;
      const leftX = 280;
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold italic 24px Arial";
      ctx.fillText(finalInstructorName, leftX, footerY - 50);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX - 120, footerY - 40);
      ctx.lineTo(leftX + 120, footerY - 40);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 14px Arial";
      ctx.fillText((finalInstructorMajor || "HEAD INSTRUCTOR").toUpperCase(), leftX, footerY - 10);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "14px Courier New";
      ctx.fillText(`Instructor ID: ${finalInstructorNip}`, leftX, footerY + 15);

      // Footer - QR Code (Y=1450, Right)
      const rightX = width - 280;
      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${data.certId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
      });
      const qrImage = await loadImage(qrDataUrl);
      ctx.drawImage(qrImage, rightX - 70, footerY - 100, 140, 140);

      ctx.fillStyle = "#0ea5e9";
      ctx.font = "bold 12px Arial";
      ctx.fillText("SCAN TO VERIFY", rightX, footerY + 60);

      // Dynamic Hash / Details
      ctx.fillStyle = "#64748b";
      ctx.font = "14px Arial";
      ctx.fillText(`Certificate ID: ${data.certId}`, centerX, height - 120);
      ctx.fillText(`Issued: ${data.issuedAt}`, centerX, height - 90);

    } else {
      // Horizontal Layout Placement (Original)
      // Certificate Title
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#f0f9ff"; // Sky 50
      ctx.font = "bold 80px Arial";
      ctx.fillText("CERTIFICATE OF", centerX, 360);
      ctx.fillText("COMPLETION", centerX, 450);
      ctx.shadowBlur = 0;

      // "Proudly Presented To"
      ctx.fillStyle = "#94a3b8"; // Slate 400
      ctx.font = "italic 24px Arial";
      ctx.fillText("Proudly Presented To", centerX, 520);

      // Student Name
      ctx.shadowColor = "#e879f9";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#fae8ff";
      ctx.font = "bold 90px Arial";
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
      ctx.font = "bold 22px Arial";
      ctx.fillText(
        `${(data.majority || "Major").toUpperCase()} - ${(data.program || "Level").toUpperCase()}`,
        centerX,
        690
      );

      // Student User ID
      ctx.fillStyle = "#67e8f9";
      ctx.fillText(`Student ID : ${data.studentId}`, centerX, 725);

      // "For successfully completing..."
      ctx.fillStyle = "#94a3b8";
      ctx.font = "italic 20px Arial";
      ctx.fillText("For successfully completing the course:", centerX, 780);

      // Course Title
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "bold 50px Arial";
      ctx.fillText(data.courseName || "Blockchain Course", centerX, 820);

      // Footer - Instructor (Left)
      const footerY = height - 120;
      const leftX = 350;
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold italic 28px Arial";
      ctx.fillText(finalInstructorName, leftX, footerY - 50);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX - 120, footerY - 40);
      ctx.lineTo(leftX + 120, footerY - 40);
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 16px Arial";
      ctx.fillText((finalInstructorMajor || "HEAD INSTRUCTOR").toUpperCase(), leftX, footerY - 10);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "14px Courier New";
      ctx.fillText(`Instructor ID: ${finalInstructorNip}`, leftX, footerY + 15);

      // Middle Info (ID and Date)
      ctx.fillStyle = "#64748b";
      ctx.font = "14px Arial";
      ctx.fillText(`ID: ${data.certId}`, centerX, height - 60);
      ctx.fillText(`Issued: ${data.issuedAt}`, centerX, height - 40);

      // Footer - QR Code (Right)
      const rightX = width - 350;
      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify/${data.certId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 150,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
      });
      const qrImage = await loadImage(qrDataUrl);
      ctx.drawImage(qrImage, rightX - 75, footerY - 100, 150, 150);

      ctx.fillStyle = "#0ea5e9";
      ctx.font = "bold 12px Arial";
      ctx.fillText("SCAN TO VERIFY", rightX, footerY + 70);
    }
  }

  return canvas.toBuffer("image/png");
};
