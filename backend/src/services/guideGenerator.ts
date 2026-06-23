import { createCanvas } from "canvas";

// Helper function to draw a dashed rectangle with text label
const drawBox = (
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  desc: string = ""
) => {
  ctx.strokeStyle = "#3b82f6"; // Blue color
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Draw background fill (subtle blue)
  ctx.fillStyle = "rgba(59, 130, 246, 0.05)";
  ctx.fillRect(x, y, w, h);

  // Label text
  ctx.fillStyle = "#1e3a8a"; // Dark blue text
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2 - (desc ? 10 : 0));

  if (desc) {
    ctx.fillStyle = "#2563eb";
    ctx.font = "italic 11px Arial";
    ctx.fillText(desc, x + w / 2, y + h / 2 + 10);
  }
};

export const generateGuideImage = (orientation: "HORIZONTAL" | "VERTICAL"): Buffer => {
  const isVertical = orientation === "VERTICAL";
  const width = isVertical ? 1080 : 1920;
  const height = isVertical ? 1920 : 1080;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const centerX = width / 2;

  // Background Grid Blueprint style
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw margins
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Header Title
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    `UNESA CERTIFICATE BLUEPRINT MAP (${orientation} A4)`,
    centerX,
    40
  );

  if (isVertical) {
    // --- VERTICAL BLUEPRINT GUIDE ---
    // Logo Area
    drawBox(ctx, centerX - 75, 140, 150, 150, "UNIVERSITY LOGO", "Placed top-center");

    // University Text
    drawBox(ctx, centerX - 300, 310, 600, 40, "UNIVERSITY NAME TEXT", "UNIVERSITAS NEGERI SURABAYA");

    // Certificate Title
    drawBox(ctx, centerX - 400, 430, 800, 150, "CERTIFICATE TITLE", "CERTIFICATE OF COMPLETION");

    // Proudly Presented To
    drawBox(ctx, centerX - 200, 650, 400, 40, "PROUDLY PRESENTED TO", "static text");

    // Student Name
    drawBox(ctx, centerX - 450, 720, 900, 100, "STUDENT NAME", "Dynamic overlay text");

    // Major & Program
    drawBox(ctx, centerX - 350, 840, 700, 40, "STUDY PROGRAM & MAJORITY", "e.g., INFORMATICS STUDY PROGRAM");

    // Student User ID
    drawBox(ctx, centerX - 250, 890, 500, 35, "STUDENT ID", "Dynamic overlay of database User UUID");

    // For completing the course...
    drawBox(ctx, centerX - 300, 1000, 600, 35, "FOR COMPLETING COURSE STATEMENT", "static text");

    // Course Title
    drawBox(ctx, centerX - 450, 1050, 900, 80, "COURSE TITLE", "Dynamic course title (e.g., BLOCKCHAIN FUNDAMENTALS)");

    // Footer - Instructor Signature
    drawBox(ctx, 160, 1370, 240, 120, "INSTRUCTOR SIGNATURE", "Teacher NIP & Name overlay");

    // Footer - QR Code
    drawBox(ctx, width - 400, 1350, 150, 150, "VERIFICATION QR CODE", "Dynamic verify scanner");

    // Bottom Date & Cert ID
    drawBox(ctx, centerX - 300, 1720, 600, 70, "CERTIFICATE ID & ISSUE DATE", "Placed at the bottom center");

  } else {
    // --- HORIZONTAL BLUEPRINT GUIDE ---
    // Logo Area
    drawBox(ctx, centerX - 60, 90, 120, 120, "UNIVERSITY LOGO", "Placed top-center");

    // University Text
    drawBox(ctx, centerX - 300, 240, 600, 40, "UNIVERSITY NAME TEXT", "UNIVERSITAS NEGERI SURABAYA");

    // Certificate Title
    drawBox(ctx, centerX - 400, 320, 800, 150, "CERTIFICATE TITLE", "CERTIFICATE OF COMPLETION");

    // Proudly Presented To
    drawBox(ctx, centerX - 200, 490, 400, 40, "PROUDLY PRESENTED TO", "static text");

    // Student Name
    drawBox(ctx, centerX - 500, 550, 1000, 100, "STUDENT NAME", "Dynamic overlay text");

    // Major & Program
    drawBox(ctx, centerX - 400, 670, 800, 40, "STUDY PROGRAM & MAJORITY", "e.g., INFORMATICS STUDY PROGRAM");

    // Student User ID
    drawBox(ctx, centerX - 250, 715, 500, 35, "STUDENT ID", "Dynamic overlay of database User UUID");

    // For completing the course...
    drawBox(ctx, centerX - 300, 765, 600, 35, "FOR COMPLETING COURSE STATEMENT", "static text");

    // Course Title
    drawBox(ctx, centerX - 500, 810, 1000, 70, "COURSE TITLE", "Dynamic course title (e.g., BLOCKCHAIN FUNDAMENTALS)");

    // Footer - Instructor Signature
    drawBox(ctx, 230, 890, 240, 120, "INSTRUCTOR SIGNATURE", "Teacher NIP & Name overlay");

    // Footer - QR Code
    drawBox(ctx, width - 470, 860, 150, 150, "VERIFICATION QR CODE", "Dynamic verify scanner");

    // Bottom Date & Cert ID
    drawBox(ctx, centerX - 300, 990, 600, 70, "CERTIFICATE ID & ISSUE DATE", "Placed at the bottom center");
  }

  return canvas.toBuffer("image/png");
};
