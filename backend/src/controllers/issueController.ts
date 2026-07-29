// @ts-nocheck
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import { uploadToIpfs } from "../utils/ipfs";
import { getContract } from "../utils/gateway";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// Helper: Generate PDF Buffer (Using Image Template)
const generatePDF = async (
  data: any,
  outputPath: string | null = null,
): Promise<Buffer> => {
  console.log("🛠️ START GENERATING PDF...");

  return new Promise(async (resolve, reject) => {
    try {
      // 1. Setup Dokumen A4 Landscape
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0, // Margin 0 agar gambar full layar
      });

      // Stream to file if output path is provided
      if (outputPath) {
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
      }

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: any) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- 2. LOAD BACKGROUND TEMPLATE ---
      // Fix: Use path.resolve for robust path finding
      const bgPath = path.resolve(__dirname, "../../assets/template.png");

      if (fs.existsSync(bgPath)) {
        // Tempel gambar full satu halaman (841.89 x 595.28 points)
        doc.image(bgPath, 0, 0, { width: 841.89, height: 595.28 });
      } else {
        console.warn(
          `⚠️ Background image not found at ${bgPath}! Text will be plain.`,
        );
      }

      // --- 3. GENERATE QR CODE ---
      const verifyUrl = `http://localhost:3000/verify/${data.certId}`;
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: "#D32F2F", // QR Code warna Merah bata (biar matching)
          light: "#00000000", // Background transparan
        },
      });

      // --- 4. DATA WRITING (STYLED) ---

      // Lebar halaman A4 Landscape
      const pageWidth = doc.page.width;

      // A. NAMA MAHASISWA (Merah, Besar, Serif)
      // Y=220 adalah perkiraan posisi di bawah tombol "GIVEN TO"
      doc
        .font("Times-Bold")
        .fontSize(42)
        .fillColor("#D32F2F")
        .text(data.name || "NAMA MAHASISWA", 0, 220, {
          align: "center",
          width: pageWidth,
        });

      // B. MAJORITY & PROGRAM (Merah, Lebih Kecil, Sans-Serif)
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D32F2F")
        .text(
          `${(data.majority || "MAJORITY").toUpperCase()} MAJORITY`,
          0,
          275,
          { align: "center", width: pageWidth },
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D32F2F")
        .text(
          `${(data.program || "STUDY PROGRAM").toUpperCase()} STUDY PROGRAM`,
          0,
          295,
          { align: "center", width: pageWidth },
        );

      // C. Student ID
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#D32F2F")
        .text(`Student ID : ${data.studentId || "0000000"}`, 0, 325, {
          align: "center",
          width: pageWidth,
        });

      // D. NAMA KURSUS / TOPIK (Pink, Besar)
      // Posisi di bawah teks statis "on the topic of:"
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
          },
        );

      // F. PENERBIT / REKTOR (Merah, Bawah Garis)
      // Koordinat Y=510 (Di bawah garis tanda tangan)
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

      // G. QR CODE (Pojok Kanan Bawah)
      // X=680, Y=430 (Sesuaikan dengan area kosong di template)
      doc.image(qrBuffer, 680, 420, { width: 110 });

      // ID Text di bawah QR
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

export const issueCertificate = async (req: Request, res: Response) => {
  try {
    // Extract Data
    const {
      name,
      studentName,
      program,
      majority,
      issuedAt,
      issuerId,
      issuerRole,
      courseName,
      studentId, // Extract Student ID
    } = req.body;

    const finalName = studentName || name;

    // Validation
    if (!finalName || !studentId || !program || !majority) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Prepare Blockchain Data
    const certId = uuidv4();
    const status = "ISSUED";
    const finalIssuerId = issuerId || "admin";
    const finalIssuerRole = issuerRole || "admin";
    const finalCourse = courseName || "Blockchain Basic"; // Default value

    const formattedDate =
      issuedAt ||
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    // Create Hash
    const dataString = JSON.stringify({
      studentName: finalName,
      studentId,
      program,
      majority,
      course: finalCourse,
      issuedAt: formattedDate,
    });
    const dataHash = crypto
      .createHash("sha256")
      .update(dataString)
      .digest("hex");

    console.log(`Processing Issue for: ${finalName} (${certId})`);

    // --- 3. STRUCTURED STORAGE (New Feature) ---
    // Sanitize function for folder names
    const safeFolder = (str: string) => str.replace(/[^a-z0-9]/gi, "_");

    // Construct Path: public/certs/{Majority}/{StudyProgram}/{CourseName}/
    // Note: process.cwd() is usually backend root. We assume 'public' folder exists or we make it.
    const dirPath = path.join(
      process.cwd(),
      "public",
      "certs",
      safeFolder(majority),
      safeFolder(program),
      safeFolder(finalCourse),
    );

    // Ensure directory exists recursively
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Define File Path: {StudentID}-{CertID}.pdf
    const fileName = `${studentId}-${certId}.pdf`;
    const filePath = path.join(dirPath, fileName);

    // 4. GENERATE PDF (And Save to File)
    const pdfBuffer = await generatePDF(
      {
        name: finalName,
        studentId,
        program,
        majority,
        courseName: finalCourse,
        issuedAt: formattedDate,
        certId,
        issuerId: finalIssuerId,
      },
      filePath, // Pass output path to save file
    );

    console.log(`📄 PDF Saved locally: ${filePath}`);

    // 5. Upload to IPFS (with structured MFS path)
    const mfsPath = `/${safeFolder(majority)}/${safeFolder(
      program,
    )}/${safeFolder(finalCourse)}/${safeFolder(finalName)}/${fileName}`;

    console.log(`Open IPFS Uploading to MFS: ${mfsPath}`);

    const cid = await uploadToIpfs(pdfBuffer, mfsPath);
    console.log(`File uploaded to IPFS. CID: ${cid}`);

    // 6. Submit to Fabric
    const { contract } = await getContract(finalIssuerId, finalIssuerRole);
    await contract.submitTransaction(
      "IssueCertificate",
      certId,
      finalName,
      studentId || "",
      program,
      majority,
      "", // score — not available in legacy issue flow
      formattedDate,
      dataHash,
      cid,
      status,
      finalIssuerId,
      finalIssuerRole,
    );

    console.log(`Transaction committed to Fabric.`);

    res.status(200).json({
      ok: true,
      certId,
      cid,
      ipfsUrl: `http://127.0.0.1:8080/ipfs/${cid}`,
      localPath: `/certs/${safeFolder(majority)}/${safeFolder(
        program,
      )}/${safeFolder(finalCourse)}/${fileName}`, // Relative path for serving
      message: "Certificate issued successfully.",
      record: {
        certId,
        studentId,
        name: finalName,
        program,
        majority,
        cid,
        status,
        issuedAt: formattedDate,
        hash: dataHash,
      },
    });
  } catch (error: any) {
    console.error("Issue Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 7. VERIFY CERTIFICATE (GET /verify/:id)
// 7. VERIFY CERTIFICATE (GET /verify/:id)
export const getCertificateFromChain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Certificate ID is required" });
    }

    console.log(`🔍 Verifying Certificate: ${id}`);

    // OPTIMIZATION: Try fetching from Local DB first to get richer data (Course Title, etc.)
    // The previous implementation only fetched from Chain which lacks relation data.
    const { prisma } = require("../config/db"); // Lazy load
    const localCert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: id }, { certId: id }],
      },
      include: {
        course: {
          select: { title: true, id: true, imageUrl: true },
        },
      },
    });

    // If found locally, we still want to verify against the chain for "Blockchain Proof"
    let chainData = null;
    try {
      const { contract } = await getContract("admin", "admin");
      const resultBuffer = await contract.evaluateTransaction(
        "ReadCertificate",
        id,
      );
      if (resultBuffer && resultBuffer.length > 0) {
        chainData = JSON.parse(resultBuffer.toString());
      }
    } catch (chainErr) {
      console.warn(
        "Chain verification failed (might be network issue or not synced):",
        chainErr,
      );
      // If strict mode, maybe fail? For now, we allow local data if chain fails but mark as unverified?
      // Actually, the frontend expects "source: blockchain".
    }

    if (!localCert && !chainData) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Merge data: Local DB has rich formatting, Chain has 'trust'
    const mergedData = {
      ...chainData, // Base from chain
      ...localCert, // Overwrite/extend with local DB (e.g. relations)
      // Ensure critical fields match chain if available
      certId: chainData?.certId || localCert?.certId,
      status: chainData?.status || localCert?.status,
    };

    res.json({
      ok: true,
      source: chainData ? "blockchain" : "database",
      data: mergedData,
    });
  } catch (error: any) {
    console.error("Verify Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
