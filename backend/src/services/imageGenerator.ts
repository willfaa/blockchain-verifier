import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import * as QRCode from "qrcode";

export interface CertData {
  name: string;
  courseName: string;
  majority: string;
  program: string;
  certId: string;
  issuedAt: string;
  issuerId: string;
  nisn: string;
  // Dynamic Instructor Details
  instructorName?: string;
  instructorNip?: string;
  instructorMajor?: string;
}

export const generateCertificateImage = async (
  data: CertData,
): Promise<Buffer> => {
  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // --- 1. DARK BACKGROUND & TEXTURE ---
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

  // --- 2. DECORATIVE FRAME & ACCENTS ---
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

  // --- 3. LOGO & HEADER ---
  const centerX = width / 2;

  // LOGO
  const logoPath = path.resolve(__dirname, "../../assets/unesa-logo.png");
  try {
    const logoImage = await loadImage(logoPath);
    const logoSize = 120;
    ctx.drawImage(logoImage, centerX - logoSize / 2, 100, logoSize, logoSize);
  } catch (err) {
    // Fallback circle
    ctx.beginPath();
    ctx.arc(centerX, 160, 50, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();
  }

  // University Name
  ctx.textAlign = "center";
  ctx.fillStyle = "#cbd5e1"; // Slate 300
  ctx.font = "bold 24px Arial";
  ctx.fillText("UNIVERSITAS NEGERI SURABAYA", centerX, 260);

  // Title: CERTIFICATE OF COMPLETION
  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#f0f9ff"; // Sky 50
  ctx.font = "bold 80px Arial";
  ctx.fillText("CERTIFICATE OF", centerX, 360);
  ctx.fillText("COMPLETION", centerX, 450);
  ctx.shadowBlur = 0;

  // --- 4. STUDENT AND COURSE INFO ---

  // "Proudly Presented To"
  ctx.fillStyle = "#94a3b8"; // Slate 400
  ctx.font = "italic 24px Arial";
  ctx.fillText("Proudly Presented To", centerX, 520);

  // Student Name
  ctx.shadowColor = "#e879f9"; // Fuchsia glow
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#fae8ff"; // Fuchsia 50
  ctx.font = "bold 90px Arial";
  ctx.fillText(data.name, centerX, 620);
  ctx.shadowBlur = 0;

  // Student Details (Divider)
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 300, 650);
  ctx.lineTo(centerX + 300, 650);
  ctx.stroke();

  // Major / Program / NISN
  ctx.fillStyle = "#e2e8f0"; // Slate 200
  ctx.font = "bold 22px Arial";
  ctx.fillText(
    `${(data.majority || "Major").toUpperCase()} - ${(
      data.program || "Level"
    ).toUpperCase()}`,
    centerX,
    690,
  );
  ctx.fillStyle = "#67e8f9"; // Cyan 300
  ctx.fillText(`NISN : ${data.nisn}`, centerX, 725); // Slightly below

  // COURSE NAME (Added prominently below details)
  ctx.fillStyle = "#94a3b8"; // Slate 400
  ctx.font = "italic 20px Arial";
  ctx.fillText("For successfully completing the course:", centerX, 780);

  // Course Title Box
  const courseY = 820;
  ctx.fillStyle = "#e0f2fe"; // Sky 100
  ctx.font = "bold 50px Arial";
  ctx.fillText(data.courseName || "Blockchain Course", centerX, courseY);

  // --- 5. FOOTER & SIGNATURE ---
  const footerY = height - 120;

  // INSTRUCTOR (Left)
  ctx.textAlign = "center";
  const leftX = 350;

  // Name
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold italic 28px Arial";
  ctx.fillText(data.instructorName || "Instructor Name", leftX, footerY - 50);

  // Signature Line
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX - 120, footerY - 40);
  ctx.lineTo(leftX + 120, footerY - 40);
  ctx.stroke();

  // Role -> MAJORITY
  ctx.fillStyle = "#cbd5e1"; // Slate 300
  ctx.font = "bold 16px Arial";
  // Use inserted majority or fallback
  const instructorTitle = (
    data.instructorMajor || "HEAD INSTRUCTOR"
  ).toUpperCase();
  ctx.fillText(instructorTitle, leftX, footerY - 10);

  // NIP
  ctx.fillStyle = "#38bdf8"; // Sky 400
  ctx.font = "14px Courier New";
  ctx.fillText(`NIP: ${data.instructorNip || "-"}`, leftX, footerY + 15);

  // ID & DATE (Middle/Bottom)
  ctx.fillStyle = "#64748b";
  ctx.font = "14px Arial";
  ctx.fillText(`ID: ${data.certId}`, centerX, height - 60);
  ctx.fillText(`Issued: ${data.issuedAt}`, centerX, height - 40);

  // QR CODE (Right)
  const rightX = width - 350;
  const verifyUrl = `http://localhost:3000/verify/${data.certId}`;

  // Generate QR
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 150,
    margin: 1,
    color: {
      dark: "#ffffff",
      light: "#00000000",
    },
  });
  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, rightX - 75, footerY - 100, 150, 150);

  ctx.fillStyle = "#0ea5e9";
  ctx.font = "bold 12px Arial";
  ctx.fillText("SCAN TO VERIFY", rightX, footerY + 70);

  return canvas.toBuffer("image/png");
};
