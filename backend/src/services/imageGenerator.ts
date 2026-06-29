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
  customTemplatePath?: string;
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
  // Resolve layout setting
  const activeLayout = data.layout || (await getLayoutSetting());
  const isVertical = activeLayout === "VERTICAL";

  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const centerX = width / 2;

  // --- 1. DRAW BACKGROUND (CUSTOM OR DEFAULT) ---
  let customImg = null;
  if (data.customTemplatePath) {
    try {
      if (
        data.customTemplatePath.startsWith("http://") ||
        data.customTemplatePath.startsWith("https://")
      ) {
        console.log(`[imageGenerator] Fetching remote template image: ${data.customTemplatePath}`);
        const response = await axios.get(data.customTemplatePath, {
          responseType: "arraybuffer",
          timeout: 10000,
        });
        const buffer = Buffer.from(response.data);
        customImg = await loadImage(buffer);
      } else if (fs.existsSync(data.customTemplatePath)) {
        customImg = await loadImage(data.customTemplatePath);
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
    ctx.fillText(data.instructorName || "Instructor Name", leftX, footerY - 50);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX - 120, footerY - 40);
    ctx.lineTo(leftX + 120, footerY - 40);
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 14px Arial";
    ctx.fillText((data.instructorMajor || "HEAD INSTRUCTOR").toUpperCase(), leftX, footerY - 10);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "14px Courier New";
    ctx.fillText(`NIP: ${data.instructorNip || "-"}`, leftX, footerY + 15);

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
    ctx.fillText(data.instructorName || "Instructor Name", leftX, footerY - 50);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX - 120, footerY - 40);
    ctx.lineTo(leftX + 120, footerY - 40);
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 16px Arial";
    ctx.fillText((data.instructorMajor || "HEAD INSTRUCTOR").toUpperCase(), leftX, footerY - 10);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "14px Courier New";
    ctx.fillText(`NIP: ${data.instructorNip || "-"}`, leftX, footerY + 15);

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

  return canvas.toBuffer("image/png");
};
