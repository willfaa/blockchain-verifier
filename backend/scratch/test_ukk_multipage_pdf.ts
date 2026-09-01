import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { generateCertificateImage, generateCertificateTranscriptCanvas } from "../src/services/imageGenerator";
const PDFDocument = require("pdfkit");

async function testMultiPagePdf() {
  console.log("=== Testing UKK Multi-Page 2-Page Duplex PDF Generator ===");

  const certData = {
    certId: "e9f2a4b8-7c3d-4e5f-9a18-2b3c4d5e6f7a",
    certificateNumber: "421.5/089/SMKN1-SBY/RPL/2026",
    schoolName: "SMK NEGERI 1 SURABAYA",
    name: "AHMAD FAHMI",
    studentId: "0056789123",
    majority: "Teknologi Informasi dan Komunikasi",
    program: "Rekayasa Perangkat Lunak (RPL)",
    courseName: "Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak",
    issuedAt: "15 September 2026",
    issuerId: "admin",
    instructorName: "Drs. H. Mulyono, M.Pd.",
    instructorNip: "197204121998021003",
    instructorMajor: "Kepala SMK Negeri 1 Surabaya",
    signers: [
      {
        name: "Drs. H. Mulyono, M.Pd.",
        title: "KEPALA SEKOLAH / KETUA TIM PENGUJI",
        role: "INSTITUSI",
        nip: "197204121998021003",
        institution: "SMK NEGERI 1 SURABAYA",
      },
      {
        name: "Ir. Hendra Kusuma, M.Kom.",
        title: "ASESOR PENGUJI EKSTERNAL",
        role: "DUDI",
        nip: "REG-BNSP-7782-2026",
        institution: "PT. TELKOM INDONESIA (PERSERO) TBK",
      },
    ],
    competencyUnits: [
      { code: "J.620100.004.01", title: "Menerapkan Pemrograman Berorientasi Objek (OOP)", standard: "SKKNI", result: "KOMPETEN" },
      { code: "J.620100.009.02", title: "Menggunakan Struktur Data dan Algoritma Dasar", standard: "SKKNI", result: "KOMPETEN" },
      { code: "J.620100.017.02", title: "Mengimplementasikan Basis Data Relasional (SQL/PostgreSQL)", standard: "SKKNI", result: "KOMPETEN" },
      { code: "J.620100.025.02", title: "Melakukan Pengujian Perangkat Lunak (Software Unit Testing)", standard: "SKKNI", result: "KOMPETEN" },
      { code: "J.620100.033.02", title: "Mengembangkan Arsitektur API dan Smart Contract Terdistribusi", standard: "SKKNI", result: "KOMPETEN" },
    ],
    layout: "HORIZONTAL" as const,
    paperSize: "A4",
  };

  const [frontBuffer, backBuffer] = await Promise.all([
    generateCertificateImage(certData as any),
    generateCertificateTranscriptCanvas(certData as any),
  ]);

  console.log(`Page 1 (Front) Buffer: ${frontBuffer.length} bytes`);
  console.log(`Page 2 (Transcript) Buffer: ${backBuffer.length} bytes`);

  const outputPath = path.join(__dirname, "sample_ukk_certificate_2page.pdf");
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Page 1
  doc.image(frontBuffer, 0, 0, { width: pageWidth, height: pageHeight });

  // Page 2
  doc.addPage({ size: "A4", layout: "landscape", margin: 0 });
  doc.image(backBuffer, 0, 0, { width: pageWidth, height: pageHeight });

  doc.end();

  await new Promise<void>((resolve) => {
    writeStream.on("finish", () => resolve());
  });
  console.log(`✅ Successfully generated 2-page duplex PDF at: ${outputPath}`);
}

testMultiPagePdf()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
