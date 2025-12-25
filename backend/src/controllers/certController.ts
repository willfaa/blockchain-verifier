// backend/src/controllers/certController.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import * as QRCode from "qrcode";
import {
  issueCertificateOnFabric,
  getCertificateFromFabric,
  revokeCertificateOnFabric,
  getAllCertificatesFromFabric,
} from "../fabric/client";
import {
  saveCertificate,
  findCertificateById,
  revokeCertificate as revokeCertificateRepo,
} from "../repositories/certRepo";
import { prisma, query } from "../config/db";
import { CertificateRecord } from "../types";
import { generateCertificateImage } from "../services/imageGenerator";
import { uploadToIpfs } from "../utils/ipfs";

// URL Frontend untuk verifikasi publik
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

export class CertController {
  public async issueCertificate(req: Request, res: Response) {
    try {
      // 1. Ambil Identitas Issuer (Dosen/Admin yang login)
      // Ini penting untuk Audit Trail di Blockchain
      const issuerId = req.user?.identifier || "SYSTEM";
      const issuerRole = req.user?.role || "admin";

      console.log(`Processing Issue Request by: ${issuerId} (${issuerRole})`);

      // 2. Destructure Body
      let { certId, nim, name, majority, program, cid, hash, issuedAt, nonce } =
        req.body ?? {};

      // 3. Generate ID & Nonce otomatis jika kosong
      if (!certId) certId = uuidv4();
      if (!nonce) nonce = crypto.randomBytes(16).toString("hex");

      // Validasi Field Wajib (Data-Driven)
      if (!certId || !nim || !name || !majority || !program) {
        return res.status(400).json({
          ok: false,
          error: "Missing required fields (nim, name, majority, program)",
        });
      }

      // 4. Generate Data Hash (Fingerprint)
      // Since we don't upload files anymore, the "File Hash" is now the "Data Hash".
      // Formula: SHA256(nim + name + program + majority)
      // This ensures any tampering with the data changes the hash.
      const dataString = `${nim}|${name}|${program}|${majority}`;
      hash = crypto.createHash("sha256").update(dataString).digest("hex");

      // No IPFS for Data-Driven Certificates
      cid = "";

      // 5. PRE-FLIGHT CHECK (Strict Mode)
      // Jika strict, pastikan Fabric ready SEBELUM menyimpan ke DB.
      const ISSUE_STRICT =
        String(process.env.ISSUE_STRICT).toLowerCase() === "true";

      if (ISSUE_STRICT) {
        try {
          console.log("🔒 Strict Mode ON: Checking Fabric connection...");
          const { checkFabricReady } = require("../fabric/client");
          await checkFabricReady(issuerId, issuerRole);
          console.log("✅ Fabric Connection Verified.");
        } catch (err: any) {
          console.error("❌ Fabric Pre-flight Check Failed:", err.message);
          return res.status(503).json({
            ok: false,
            error: "Blockchain network Unavailable (Strict Mode)",
            detail: err.message,
          });
        }
      }

      // 6. Generate QR Code
      // QR ini berisi link: http://localhost:3000/verify/UUID
      const verificationUrl = `${CLIENT_URL}/verify/${certId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

      // --- IMAGE GENERATION & IPFS UPLOAD (PNG) ---
      console.log("�️ Generating Certificate Image (PNG)...");
      const imgBuffer = await generateCertificateImage({
        certId,
        name,
        nim,
        program,
        majority,
        courseName: "Program Completion", // Fallback for manual issue
        issuedAt: issuedAt || new Date().toISOString(),
        issuerId,
      });

      console.log("☁️ Uploading PNG to IPFS...");
      // Upload ke IPFS Local
      cid = await uploadToIpfs(imgBuffer, `/certs/${certId}.png`);
      console.log(`✅ IPFS Upload Success. CID: ${cid}`);

      // 7. Siapkan Object Record (Status: PENDING)
      const record: CertificateRecord = {
        certId,
        nim,
        name,
        majority,
        program,
        cid: cid, // Populated from IPFS upload
        hash, // Data Hash
        status: "PENDING", // Atomic Step 1
        issuedAt: issuedAt || new Date().toISOString(),
        nonce,
      };

      console.log(
        `Atomic Issuance: Inserting PENDING record ${certId} to DB...`
      );

      // 8. Insert DB (Pending)
      await saveCertificate(record);

      try {
        console.log(`Atomic Issuance: Submitting to Fabric...`);

        // 9. Submit to Fabric (Status: ISSUED)
        const fabricRecord = { ...record, status: "ISSUED" as const };

        // Mengirim issuerId dan issuerRole ke Client Fabric
        await issueCertificateOnFabric(fabricRecord, issuerId, issuerRole);

        console.log(
          `Atomic Issuance: Fabric Success. Updating DB to ISSUED...`
        );

        // 10. Update DB (Issued)
        record.status = "ISSUED";
        await saveCertificate(record);
      } catch (fabricErr: any) {
        console.error(
          `Atomic Issuance: Fabric Failed. ROLLING BACK...`,
          fabricErr
        );

        // ROLLBACK: Hapus data di DB agar konsisten jika blockchain gagal
        await query("DELETE FROM certificates WHERE cert_id = $1", [certId]);

        throw new Error(
          `Fabric submission failed: ${fabricErr.message}. DB Rolled back.`
        );
      }

      // 11. Sukses! Kembalikan Record + QR Code
      return res.json({
        ok: true,
        message: "Certificate Issued Successfully",
        record,
        qrCode: qrCodeDataUrl,
        verificationUrl: verificationUrl,
      });
    } catch (err: any) {
      console.error("Issue Certificate Error:", err);
      // Fallback error handling if headers not sent
      if (!res.headersSent) {
        return res.status(500).json({
          ok: false,
          error: "Failed to issue certificate",
          detail: err.message || String(err),
        });
      }
    }
  }

  public async revokeCertificate(req: Request, res: Response) {
    // Unchanged
    const { certId, reason } = req.body;
    if (!certId || !reason) {
      return res
        .status(400)
        .json({ ok: false, error: "certId and reason are required" });
    }

    try {
      console.log(`Revoking certificate ${certId}...`);

      // 1. Update DB Local
      await revokeCertificateRepo(certId, reason);

      // 2. Submit Revoke Transaction ke Fabric
      const revokedAt = new Date().toISOString();
      await revokeCertificateOnFabric(certId, reason, revokedAt);

      return res.json({
        ok: true,
        message: "Certificate revoked successfully",
      });
    } catch (err: any) {
      console.error("Revoke failed:", err);
      return res.status(500).json({
        ok: false,
        error: "Revocation failed",
        detail: err.message,
      });
    }
  }

  public async getCertificate(req: Request, res: Response) {
    const certId = req.params.id;
    if (!certId) {
      return res
        .status(400)
        .json({ ok: false, error: "id parameter required" });
    }

    try {
      // Use Prisma to fetch the certificate AND the related course data
      // This is crucial for the frontend UI which needs course.title
      const record = await prisma.certificate.findFirst({
        where: {
          OR: [{ id: certId }, { certId: certId }],
        },
        include: {
          course: {
            select: { title: true, id: true, thumbnail: true },
          },
        },
      });

      if (!record) {
        // Optional: Check Fabric as a last resort fallback,
        // but we won't have the course title, so the UI might still partial-fail
        // unless we handle it. For now, we assume if it's in the app, it's in the DB.
        return res
          .status(404)
          .json({ ok: false, error: "Certificate not found" });
      }

      return res.json({ ok: true, record });
    } catch (err: any) {
      console.error("Get certificate error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to retrieve certificate",
        detail: err.message,
      });
    }
  }

  public async getAllCertificates(req: Request, res: Response) {
    // Unchanged
    try {
      // Ambil username dari token login (admin/teacher)
      const username = req.user?.identifier || "admin";
      const role = req.user?.role || "admin";

      // Panggil Fabric Client yang baru dibuat
      const data = await getAllCertificatesFromFabric(username, role);

      return res.json({
        ok: true,
        count: data.length,
        data: data,
      });
    } catch (err: any) {
      console.error("Get All Certificates Error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch certificates from Blockchain",
        detail: err.message,
      });
    }
  }

  public async claimCertificate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // Student ID
      const userEmail = (req as any).user?.email; // Fallback for ID
      const { courseId } = req.body;

      if (!userId || !courseId) {
        return res.status(400).json({ error: "Missing userId or courseId" });
      }

      console.log(`🎓 Student Claim Request: ${userId} for Course ${courseId}`);

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          },
        },
        include: {
          user: true,
          course: {
            include: {
              teacher: true, // Fetch Teacher details (User relation)
              // @ts-ignore
              exams: true,
            },
          },
        },
      });

      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      // Explicit cast to any to avoid strict type issues if Prisma client is not fully regenerated
      const student = (enrollment as any).user;
      const course = (enrollment as any).course;

      // 2. Check if already has certificate (Prevent Double Claim)
      // Check certificates table directly
      const existingCert = await prisma.certificate.findFirst({
        where: {
          userId: userId, // Corrected from studentId
          courseId: courseId,
          status: { in: ["ISSUED", "PENDING"] },
        },
      });

      if (existingCert) {
        return res.status(400).json({
          error: "Certificate already issued (or pending) for this course",
        });
      }

      // 3. Validate Exam Result (must be PASSED)
      // Take the first exam found (assuming single exam per course logic)
      const exam =
        course.exams && course.exams.length > 0 ? course.exams[0] : null;

      if (!exam) {
        return res.status(400).json({ error: "Course does not have an exam" });
      }

      const bestResult = await prisma.examResult.findFirst({
        where: {
          examId: exam.id,
          studentId: userId,
          status: "PASSED",
        },
      });

      if (!bestResult) {
        return res
          .status(403)
          .json({ error: "You have not passed the exam yet." });
      }

      // 4. Prepare Data for Issuance
      const certId = uuidv4();
      const nonce = crypto.randomBytes(16).toString("hex");

      // FIX: Use consistent English date format  (e.g., 25 December 2025)
      const issuedAt = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

      const pdfData = {
        certId,
        name: student.name,
        courseName: course.title,
        majority: student.majority || "General",
        program: student.studyProgram || "General",
        issuedAt,
        issuerId: "SYSTEM",
        nim: student.nim || student.id?.substring(0, 8),
        // Pass Dynamic Instructor Details (from Course -> Teacher)
        instructorName: course.teacher?.name || "Head Instructor",
        instructorNip: course.teacher?.nip || "-", // Fallback if empty
        instructorMajor: course.teacher?.majority || "Department of Blockchain",
      };

      console.log("️ Generating PNG for Claim...");
      const imgBuffer = await generateCertificateImage(pdfData);

      // 5. Upload to IPFS
      const cid = await uploadToIpfs(imgBuffer, `/certs/${certId}.png`);
      console.log(`✅ IPFS Upload Success: ${cid}`);

      // 6. Calculate Hash
      const dataString = `${pdfData.nim}|${pdfData.name}|${pdfData.program}|${pdfData.majority}`;
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      // 7. Save to DB (Prisma Native)
      // We map the generated 'certId' UUID to the 'id' column in the database.
      await prisma.certificate.create({
        data: {
          id: certId, // <--- MAP certId variable to 'id' column
          certId: certId, // Schema has both id and certId (unique)
          userId: userId,
          studentName: pdfData.name,
          nim: pdfData.nim,
          program: pdfData.program,
          majority: pdfData.majority,
          courseId: course.id,
          cid: cid,
          hash: hash,
          status: "PENDING",
          issuedAt: new Date().toISOString(),
        },
      });

      // Re-construct record object for Fabric (since we removed the earlier declaration)
      const record: CertificateRecord = {
        certId,
        nim: pdfData.nim,
        name: pdfData.name,
        majority: pdfData.majority,
        program: pdfData.program,
        cid,
        hash,
        status: "PENDING",
        issuedAt: new Date().toISOString(),
        nonce,
        // @ts-ignore
        courseId: course.id,
        studentId: userId,
      };

      // 8. Submit to Fabric (As Admin/System)
      // Issuer is "SYSTEM" or "Admin"
      try {
        await issueCertificateOnFabric(
          { ...record, status: "ISSUED" },
          "admin",
          "admin"
        );

        // 9. Update DB Status & Enrollment
        // Update Certificate Status
        await prisma.certificate.update({
          where: { id: certId },
          data: { status: "ISSUED" },
        });

        // Update Enrollment
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            // @ts-ignore
            certificateId: certId,
            completedAt: new Date(),
          },
        });
      } catch (fabricErr: any) {
        console.error("FULL FABRIC ERROR:", fabricErr);
        // Throw the REAL error message to the frontend so we can debug
        throw new Error(`Fabric: ${fabricErr.message || fabricErr}`);
      }

      return res.json({
        ok: true,
        message: "Certificate claimed successfully",
        certId,
        cid,
      });
    } catch (err: any) {
      console.error("Claim Certificate Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
  public async getMyCertificates(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const certificates = await prisma.certificate.findMany({
        where: { userId: userId, status: "ISSUED" },
        orderBy: { issuedAt: "desc" }, // Sort by newest
        include: {
          course: {
            select: { title: true, thumbnail: true, id: true },
          },
        },
      });

      return res.json({ ok: true, data: certificates });
    } catch (err: any) {
      console.error("Get My Certificates Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
}
