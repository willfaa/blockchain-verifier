import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

interface PdfData {
  certId: string;
  name: string;
  nim: string;
  program: string;
  majority: string;
  courseName: string;
  issuedAt: string;
  issuerId: string;
}

// Generate PDF Buffer (Using Image Template)
export const generateCertificatePDF = async (
  data: PdfData
): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Setup Dokumen A4 Landscape
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: any) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- 2. LOAD BACKGROUND TEMPLATE ---
      const bgPath = path.resolve(__dirname, "../../assets/template.png");

      if (fs.existsSync(bgPath)) {
        doc.image(bgPath, 0, 0, { width: 841.89, height: 595.28 });
      } else {
        console.warn(
          `⚠️ Background image not found at ${bgPath}! Text will be plain.`
        );
      }

      // --- 3. GENERATE QR CODE ---
      const verifyUrl = `http://localhost:3000/verify/${data.certId}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: "#D32F2F", // QR Code warna Merah bata
          light: "#00000000", // Background transparan
        },
      });

      // --- 4. DATA WRITING (STYLED) ---
      const pageWidth = doc.page.width;

      // A. NAMA MAHASISWA
      doc
        .font("Times-Bold")
        .fontSize(42)
        .fillColor("#D32F2F")
        .text(data.name || "NAMA MAHASISWA", 0, 220, {
          align: "center",
          width: pageWidth,
        });

      // B. MAJORITY & PROGRAM
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D32F2F")
        .text(
          `${(data.majority || "MAJORITY").toUpperCase()} MAJORITY`,
          0,
          275,
          { align: "center", width: pageWidth }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D32F2F")
        .text(
          `${(data.program || "STUDY PROGRAM").toUpperCase()} STUDY PROGRAM`,
          0,
          295,
          { align: "center", width: pageWidth }
        );

      // C. NIM
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D32F2F")
        .text(`NIM : ${data.nim || "0000000"}`, 0, 325, {
          align: "center",
          width: pageWidth,
        });

      // D. NAMA KURSUS / TOPIK
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .fillColor("#FF4081") // Pink Color
        .text(
          (data.courseName || "BLOCKCHAIN FUNDAMENTALS").toUpperCase(),
          0,
          420,
          {
            align: "center",
            width: pageWidth,
          }
        );

      // F. PENERBIT / REKTOR
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#D32F2F")
        .text("LINUS TORVALD", 0, 515, { align: "center", width: pageWidth });

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#D32F2F")
        .text(`NIP : ${data.issuerId || "123456"}`, 0, 535, {
          align: "center",
          width: pageWidth,
        });

      // G. QR CODE
      doc.image(qrBuffer, 680, 420, { width: 110 });

      // ID Text
      doc
        .fontSize(8)
        .fillColor("#555")
        .text(`ID: ${data.certId.substring(0, 8)}...`, 680, 535, {
          align: "center",
          width: 110,
        });

      doc.end();
    } catch (err) {
      console.error("❌ PDF Drawing Error:", err);
      reject(err);
    }
  });
};
