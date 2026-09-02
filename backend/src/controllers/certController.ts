// @ts-nocheck
// backend/src/controllers/certController.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import * as QRCode from "qrcode";
import {
  issueCertificateOnFabric,
  getCertificateFromFabric,
  revokeCertificateOnFabric,
  supersedeCertificateOnFabric,
  getAllCertificatesFromFabric,
  syncPendingCertificatesToFabric,
} from "../fabric/client";
import {
  saveCertificate,
  findCertificateById,
  revokeCertificate as revokeCertificateRepo,
} from "../repositories/certRepo";
import { prisma } from "../config/db";
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
      let {
        certId,
        studentId,
        nim,
        nisn,
        name,
        majority,
        program,
        cid,
        hash,
        issuedAt,
        score,
        courseId,
        certificateNumber,
        schoolName,
        signers,
        competencyUnits,
        layoutMode,
      } = req.body ?? {};

      // Fallback for compatibility
      if (!studentId) studentId = nim || nisn;

      // 3. Generate ID otomatis jika kosong
      if (!certId) certId = uuidv4();

      // Validasi Field Wajib (Data-Driven)
      if (!certId || !studentId || !name || !majority || !program) {
        return res.status(400).json({
          ok: false,
          error: "Missing required fields (studentId, name, majority, program)",
        });
      }

      // Auto-fetch course competency units if not provided in body
      if ((!competencyUnits || !Array.isArray(competencyUnits) || competencyUnits.length === 0) && courseId) {
        try {
          const dbUnits = await prisma.courseCompetencyUnit.findMany({
            where: { courseId },
            orderBy: { order: "asc" },
          });
          if (dbUnits.length > 0) {
            competencyUnits = dbUnits.map((u) => ({
              code: u.code,
              title: u.title,
              standard: u.standard || "SKKNI",
              result: "KOMPETEN",
            }));
          }
        } catch (e) {}
      }

      // 4. Generate Deterministic Data Hash (Fingerprint)
      const certNumber = certificateNumber || `UKK/${certId.substring(0, 8).toUpperCase()}`;
      const unitsHash = competencyUnits ? JSON.stringify(competencyUnits) : "";
      const dataString = `${certNumber}|${studentId}|${name}|${program}|${majority}|${unitsHash}`;
      hash = crypto.createHash("sha256").update(dataString).digest("hex");

      // Pinata IPFS Decentralized Transcript Artifact
      if (process.env.PINATA_JWT) {
        try {
          const pinataJwt = process.env.PINATA_JWT.replace(/^["']|["']$/g, "").trim();
          const pinRes = await axios.post(
            "https://api.pinata.cloud/pinning/pinJSONToIPFS",
            {
              pinataMetadata: { name: `Cert_${studentId}_${certId.substring(0, 8)}.json` },
              pinataContent: {
                certId,
                certificateNumber: certNumber,
                studentName: name,
                studentId,
                program,
                majority,
                hash,
                competencyUnits,
                issuedAt: new Date().toISOString(),
              },
            },
            {
              headers: { Authorization: `Bearer ${pinataJwt}` },
              timeout: 3000,
            }
          );
          if (pinRes.data?.IpfsHash) {
            cid = pinRes.data.IpfsHash;
          } else {
            cid = `Qm${hash.substring(0, 44)}`;
          }
        } catch (e: any) {
          cid = `Qm${hash.substring(0, 44)}`;
        }
      } else {
        cid = `Qm${hash.substring(0, 44)}`;
      }

      // 5. PRE-FLIGHT CHECK (Strict Mode)
      // Jika strict, pastikan Fabric ready SEBELUM menyimpan ke DB.
      const ISSUE_STRICT =
        String(process.env.ISSUE_STRICT).toLowerCase() === "true";

      if (ISSUE_STRICT) {
        try {
          console.log("🔒 Strict Mode ON: Checking Fabric connection...");
          const { checkFabricReady } = require("../fabric/client");
          await checkFabricReady(issuerId, issuerRole);
        } catch (err: any) {
          console.error("Strict Mode Failed: Fabric Not Ready");
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

      // --- RESOLVE DYNAMIC COURSE & INSTRUCTOR CONTEXT ---
      let courseName = "Program Completion";
      let customTemplatePath = undefined;
      let instructorName = undefined;
      let instructorNip = undefined;
      let instructorMajor = undefined;

      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: { user: true },
        });
        if (course) {
          courseName = course.title;
          customTemplatePath = course.certificateTemplate || undefined;
          instructorName = course.user?.name || undefined;
          instructorNip = course.user?.nip || undefined;
          instructorMajor = course.user?.studyProgram || course.user?.majority || undefined;
        }
      }

      // Fallback: Query logged-in user if course teacher details are missing
      if (!instructorName && req.user?.id) {
        const issuerUser = await prisma.user.findUnique({
          where: { id: req.user.id },
        });
        if (issuerUser) {
          instructorName = issuerUser.name;
          instructorNip = issuerUser.nip || "-";
          instructorMajor = issuerUser.studyProgram || issuerUser.majority || "Department of Blockchain";
        }
      }

      // Fallback to system settings if still missing
      let layoutConfig = undefined;
      if (!instructorName || true) { // we also want layout config
        try {
          const [nameSetting, nipSetting, layoutConfigSetting] = await Promise.all([
            prisma.systemSetting.findUnique({ where: { key: "default_certificate_instructor_name" } }),
            prisma.systemSetting.findUnique({ where: { key: "default_certificate_instructor_nip" } }),
            prisma.systemSetting.findUnique({ where: { key: "certificate_layout_config" } }),
          ]);
          if (!instructorName) {
            instructorName = nameSetting?.value || "Budi Headmaster, M.T.";
            instructorNip = nipSetting?.value || "198706152010121002";
            instructorMajor = "Teknologi Informasi";
          }
          if (layoutConfigSetting?.value) {
            try { layoutConfig = JSON.parse(layoutConfigSetting.value); } catch(e){}
          }
        } catch (e) {
          if (!instructorName) {
            instructorName = "Budi Headmaster, M.T.";
            instructorNip = "198706152010121002";
            instructorMajor = "Teknologi Informasi";
          }
        }
      }

      // --- IMAGE GENERATION & IPFS UPLOAD (PNG) ---
      console.log("️ Generating Certificate Image (PNG)...");
      const imgBuffer = await generateCertificateImage({
        certId,
        certificateNumber,
        schoolName,
        name,
        studentId,
        program,
        majority,
        courseName,
        signers,
        competencyUnits,
        layoutMode: layoutMode || "STANDARD",
        issuedAt: issuedAt || new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date()),
        issuerId,
        instructorName,
        instructorNip,
        instructorMajor,
        customTemplatePath,
        layoutConfig,
      });

      console.log("☁️ Uploading PNG to IPFS...");
      // Upload ke IPFS Local
      cid = await uploadToIpfs(imgBuffer, `/certs/${certId}.png`);
      console.log(`✅ IPFS Upload Success. CID: ${cid}`);

      // 7. Siapkan Object Record (Status: PENDING)
      const record: CertificateRecord = {
        certId,
        studentId,
        name,
        majority,
        program,
        score: score || "",
        cid: cid, // Populated from IPFS upload
        hash, // Data Hash
        status: "PENDING", // Atomic Step 1
        issuedAt: issuedAt || new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date()),
        courseId: courseId || null,
        certificateNumber: certificateNumber || null,
        schoolName: schoolName || null,
        signers: signers || null,
        competencyUnits: competencyUnits || null,
        layoutMode: layoutMode || "STANDARD",
      };

      console.log(
        `Atomic Issuance: Inserting PENDING record ${certId} to DB...`
      );

      let syncStatus = "SYNCED";
      let txId = `TX_${Date.now()}`;
      try {
        console.log(`Atomic Issuance: Submitting to Fabric...`);

        // 9. Submit to Fabric (Status: ISSUED)
        const fabricRecord = { ...record, status: "ISSUED" as const };
        const fabricResult = await issueCertificateOnFabric(fabricRecord, issuerId, issuerRole);
        if (fabricResult?.txId) txId = fabricResult.txId;

        console.log(
          `Atomic Issuance: Fabric Success. Updating DB to ISSUED (SYNCED)...`
        );

        // 10. Update DB (Issued)
        record.status = "ISSUED";
        await saveCertificate(record);
        await prisma.certificate.update({
          where: { certId: certId },
          data: {
            blockchainSyncStatus: "SYNCED",
            blockchainTxId: txId,
            syncedAt: new Date(),
          },
        });
      } catch (fabricErr: any) {
        console.warn(
          `⚠️ [Atomic Issuance Notice]: Fabric Node offline/unreachable. Saved to Mirror DB as PENDING_SYNC:`,
          fabricErr.message
        );

        // Resilient Mirror Ledger: Jangan batalkan, simpan sebagai PENDING_SYNC
        syncStatus = "PENDING_SYNC";
        record.status = "ISSUED";
        await saveCertificate(record);
        await prisma.certificate.update({
          where: { certId: certId },
          data: {
            blockchainSyncStatus: "PENDING_SYNC",
          },
        });
      }

      // 11. Sukses! Kembalikan Record + QR Code
      return res.json({
        ok: true,
        message: "Certificate Issued Successfully",
        record,
        syncStatus,
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
            select: { title: true, id: true, imageUrl: true },
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

  // --- PREVIEW CERTIFICATE ---
  // Generates the certificate PNG without saving or minting it
  public async previewCertificate(req: Request, res: Response) {
    try {
      const issuerId = req.user?.identifier || "SYSTEM";
      let { certId, studentId, nim, nisn, name, majority, program, courseId, issuedAt } = req.body ?? {};

      if (!studentId) studentId = nim || nisn;
      if (!certId) certId = "PREV-0000-0000-0000";

      if (!studentId || !name || !majority || !program) {
        return res.status(400).json({ ok: false, error: "Missing required fields" });
      }

      let courseName = "Program Completion";
      let customTemplatePath = undefined;
      let instructorName = undefined;
      let instructorNip = undefined;
      let instructorMajor = undefined;

      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: { user: true },
        });
        if (course) {
          courseName = course.title;
          customTemplatePath = course.certificateTemplate || undefined;
          instructorName = course.user?.name || undefined;
          instructorNip = course.user?.nip || undefined;
          instructorMajor = course.user?.studyProgram || course.user?.majority || undefined;
        }
      }

      if (!instructorName && req.user?.id) {
        const issuerUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (issuerUser) {
          instructorName = issuerUser.name;
          instructorNip = issuerUser.nip || "-";
          instructorMajor = issuerUser.studyProgram || issuerUser.majority || "Department of Blockchain";
        }
      }

      let layoutConfig = undefined;
      try {
        const [nameSetting, nipSetting, layoutConfigSetting] = await Promise.all([
          prisma.systemSetting.findUnique({ where: { key: "default_certificate_instructor_name" } }),
          prisma.systemSetting.findUnique({ where: { key: "default_certificate_instructor_nip" } }),
          prisma.systemSetting.findUnique({ where: { key: "certificate_layout_config" } }),
        ]);
        if (!instructorName) {
          instructorName = nameSetting?.value || "Budi Headmaster, M.T.";
          instructorNip = nipSetting?.value || "198706152010121002";
          instructorMajor = "Teknologi Informasi";
        }
        if (layoutConfigSetting?.value) {
          try { layoutConfig = JSON.parse(layoutConfigSetting.value); } catch (e) {}
        }
      } catch (e) {
        if (!instructorName) {
          instructorName = "Budi Headmaster, M.T.";
          instructorNip = "198706152010121002";
          instructorMajor = "Teknologi Informasi";
        }
      }

      const imgBuffer = await generateCertificateImage({
        certId,
        name,
        studentId,
        program,
        majority,
        courseName,
        issuedAt: issuedAt || new Intl.DateTimeFormat("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        }).format(new Date()),
        issuerId,
        instructorName,
        instructorNip,
        instructorMajor,
        customTemplatePath,
        layoutConfig,
      });

      res.setHeader("Content-Type", "image/png");
      return res.status(200).send(imgBuffer);
    } catch (error: any) {
      console.error("Preview Certificate Error:", error);
      return res.status(500).json({ ok: false, error: "Failed to generate preview", detail: error.message });
    }
  }

  public async getAllCertificates(req: Request, res: Response) {
    try {
      const username = req.user?.identifier || "admin";
      const role = req.user?.role || "admin";

      let data: any[] = [];
      let source = "blockchain";

      try {
        data = await getAllCertificatesFromFabric(username, role);
      } catch (fabricErr: any) {
        console.warn(`[CertController] Fabric getAllCertificates fallback to DB:`, fabricErr.message);
        source = "database";
        const dbCerts = await prisma.certificate.findMany({
          orderBy: { issuedAt: "desc" },
          include: {
            course: { select: { title: true, id: true, imageUrl: true } },
          },
        });
        data = dbCerts.map((c) => ({
          certId: c.certId,
          studentId: c.studentId,
          name: c.studentName,
          program: c.program,
          majority: c.majority,
          cid: c.cid,
          hash: c.hash,
          status: c.status,
          issuedAt: c.issuedAt,
          blockchainSyncStatus: c.blockchainSyncStatus,
          blockchainTxId: c.blockchainTxId,
        }));
      }

      return res.json({
        ok: true,
        source,
        count: data.length,
        data: data,
      });
    } catch (err: any) {
      console.error("Get All Certificates Error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch certificates",
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
              user: true, // Fetch Teacher details (User relation)
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
        studentId: student.studentId || student.id?.substring(0, 8),
        // Pass Dynamic Instructor Details (from Course -> Teacher/User)
        instructorName: course.user?.name || "Head Instructor",
        instructorNip: course.user?.nip || "-", // Fallback if empty
        instructorMajor: course.user?.majority || "Department of Blockchain",
        customTemplatePath: course.certificateTemplate || undefined,
      };

      console.log("️ Generating PNG for Claim...");
      const imgBuffer = await generateCertificateImage(pdfData);

      // Helper to sanitize path segments (remove special chars, replace spaces)
      const cleanPath = (str: string) => {
        return str
          .replace(/[^a-zA-Z0-9\s-_]/g, "") // Remove non-alphanumeric (except space, -, _)
          .trim()
          .replace(/\s+/g, "_"); // Replace spaces with underscores
      };

      // Construct Hierarchical MFS Path
      // Format: /certs/Majority/StudyProgram/CourseName/StudentName_CertId.png
      const mfsPath = `/certs/${cleanPath(pdfData.majority)}/${cleanPath(
        pdfData.program
      )}/${cleanPath(pdfData.courseName)}/${cleanPath(
        pdfData.name
      )}_${certId.substring(0, 8)}.png`;

      // 5. Upload to IPFS
      const cid = await uploadToIpfs(imgBuffer, mfsPath);
      console.log(`✅ IPFS Upload Success: ${cid} (MFS: ${mfsPath})`);

      // 6. Calculate Hash
      const dataString = `${pdfData.studentId}|${pdfData.name}|${pdfData.program}|${pdfData.majority}`;
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      // 7. Save to DB (Prisma Native)
      // We map the generated 'certId' UUID to the 'id' column in the database.
      await prisma.certificate.create({
        data: {
          id: certId, // <--- MAP certId variable to 'id' column
          certId: certId, // Schema has both id and certId (unique)
          userId: userId,
          studentName: pdfData.name,
          studentId: pdfData.studentId,
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
        studentId: pdfData.studentId,
        name: pdfData.name,
        majority: pdfData.majority,
        program: pdfData.program,
        score: bestResult ? String((bestResult as any).score || "") : "",
        cid,
        hash,
        status: "PENDING",
        issuedAt: new Date().toISOString(),
        // @ts-ignore
        courseId: course.id,
      };

      // 8. Submit to Fabric (As Admin/System)
      let syncStatus = "SYNCED";
      let txId = `TX_${Date.now()}`;
      try {
        const fabricResult = await issueCertificateOnFabric(
          { ...record, status: "ISSUED" },
          "admin",
          "admin"
        );
        if (fabricResult?.txId) txId = fabricResult.txId;

        // 9. Update DB Status & Sync
        await prisma.certificate.update({
          where: { id: certId },
          data: {
            status: "ISSUED",
            blockchainSyncStatus: "SYNCED",
            blockchainTxId: txId,
            syncedAt: new Date(),
          },
        });
      } catch (fabricErr: any) {
        console.warn(
          `⚠️ [Claim Certificate Notice]: Fabric offline. Saved to Mirror DB as PENDING_SYNC:`,
          fabricErr.message
        );
        syncStatus = "PENDING_SYNC";
        await prisma.certificate.update({
          where: { id: certId },
          data: {
            status: "ISSUED",
            blockchainSyncStatus: "PENDING_SYNC",
          },
        });
      }

      // Update Enrollment
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          // @ts-ignore
          certificateId: certId,
          completedAt: new Date(),
        },
      });

      return res.json({
        ok: true,
        message: "Certificate claimed successfully",
        certId,
        cid,
        syncStatus,
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
            select: { title: true, imageUrl: true, id: true },
          },
        },
      });

      return res.json({ ok: true, data: certificates });
    } catch (err: any) {
      console.error("Get My Certificates Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // --- AUTOMATED DATA DRIFT DETECTOR ---
  public async getDiscrepancies(req: Request, res: Response) {
    try {
      const certificates = await prisma.certificate.findMany({
        where: { status: "ISSUED" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
              nip: true,
              studyProgram: true,
              majority: true,
              isActive: true,
            },
          },
          course: {
            select: { id: true, title: true, imageUrl: true },
          },
          correctionRequests: {
            where: { status: "PENDING" },
          },
        },
        orderBy: { issuedAt: "desc" },
      });

      const discrepancies: any[] = [];

      for (const cert of certificates) {
        const u = cert.user;
        const diffs: string[] = [];

        if (!u) {
          diffs.push("User Account Deleted from System");
        } else {
          if (u.name && u.name.trim().toLowerCase() !== cert.studentName.trim().toLowerCase()) {
            diffs.push(`Name Mismatch: Cert ("${cert.studentName}") vs Profile ("${u.name}")`);
          }
          if (u.studentId && cert.studentId && u.studentId.trim() !== cert.studentId.trim()) {
            diffs.push(`ID/NIM Mismatch: Cert ("${cert.studentId}") vs Profile ("${u.studentId}")`);
          }
          if (u.studyProgram && cert.program && u.studyProgram.trim().toLowerCase() !== cert.program.trim().toLowerCase()) {
            diffs.push(`Program Mismatch: Cert ("${cert.program}") vs Profile ("${u.studyProgram}")`);
          }
          if (u.majority && cert.majority && u.majority.trim().toLowerCase() !== cert.majority.trim().toLowerCase()) {
            diffs.push(`Majority Mismatch: Cert ("${cert.majority}") vs Profile ("${u.majority}")`);
          }
        }

        const hasPendingCorrection = cert.correctionRequests && cert.correctionRequests.length > 0;

        if (diffs.length > 0 || hasPendingCorrection) {
          discrepancies.push({
            certificate: cert,
            diffs,
            hasPendingCorrection,
            pendingRequest: hasPendingCorrection ? cert.correctionRequests[0] : null,
            currentUser: u || null,
          });
        }
      }

      return res.json({
        ok: true,
        count: discrepancies.length,
        data: discrepancies,
      });
    } catch (err: any) {
      console.error("[CertController] getDiscrepancies Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // --- STUDENT SELF-SERVICE REQUEST CORRECTION ---
  public async requestCorrection(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { certificateId, requestedName, requestedProgram, requestedMajority, reason } = req.body;

      if (!certificateId || !reason) {
        return res.status(400).json({ error: "Certificate ID and reason are required" });
      }

      const cert = await prisma.certificate.findFirst({
        where: {
          OR: [{ id: certificateId }, { certId: certificateId }],
          userId: userId,
        },
      });

      if (!cert) {
        return res.status(404).json({ error: "Certificate not found or not owned by user" });
      }

      const request = await prisma.certificateCorrectionRequest.create({
        data: {
          certificateId: cert.id,
          userId: userId,
          requestedName: requestedName || null,
          requestedProgram: requestedProgram || null,
          requestedMajority: requestedMajority || null,
          reason: reason,
          status: "PENDING",
        },
      });

      return res.json({
        ok: true,
        message: "Correction request submitted successfully. Admin/Instructor will review it.",
        data: request,
      });
    } catch (err: any) {
      console.error("[CertController] requestCorrection Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // --- GET CORRECTION REQUESTS FOR ADMIN/TEACHER ---
  public async getCorrectionRequests(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const whereClause: any = {};
      if (status && typeof status === "string") {
        whereClause.status = status.toUpperCase();
      }

      const requests = await prisma.certificateCorrectionRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, studentId: true, avatar: true },
          },
          certificate: {
            include: {
              course: { select: { id: true, title: true, imageUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({ ok: true, count: requests.length, data: requests });
    } catch (err: any) {
      console.error("[CertController] getCorrectionRequests Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // --- SUPERSEDE / RE-ISSUE WITH CORRECTED DATA ---
  public async supersedeCertificate(req: Request, res: Response) {
    try {
      const issuerId = req.user?.identifier || "admin";
      const issuerRole = req.user?.role || "admin";
      const {
        oldCertId,
        correctedName,
        correctedStudentId,
        correctedProgram,
        correctedMajority,
        reason,
        requestId,
        updateUserProfile,
      } = req.body;

      if (!oldCertId || !reason) {
        return res.status(400).json({ error: "oldCertId and reason are required" });
      }

      // Fetch old certificate
      const oldCert = await prisma.certificate.findFirst({
        where: {
          OR: [{ id: oldCertId }, { certId: oldCertId }],
        },
        include: {
          course: { include: { user: true } },
          user: true,
        },
      });

      if (!oldCert) {
        return res.status(404).json({ error: "Original certificate not found" });
      }

      if (oldCert.status === "SUPERSEDED") {
        return res.status(400).json({ error: "Certificate has already been superseded" });
      }

      // Prepare corrected data
      const finalName = correctedName || oldCert.studentName;
      const finalStudentId = correctedStudentId || oldCert.studentId;
      const finalProgram = correctedProgram || oldCert.program;
      const finalMajority = correctedMajority || oldCert.majority;

      const newCertId = uuidv4();
      const nowFormatted = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

      // Prepare Instructor Details
      let instructorName = oldCert.course?.user?.name || "Head Instructor";
      let instructorNip = oldCert.course?.user?.nip || "-";
      let instructorMajor = oldCert.course?.user?.studyProgram || oldCert.course?.user?.majority || "Department of Blockchain";
      let customTemplatePath = oldCert.course?.certificateTemplate || undefined;

      // 1. Generate new Certificate Image with Corrected Data
      const imgBuffer = await generateCertificateImage({
        certId: newCertId,
        name: finalName,
        studentId: finalStudentId,
        program: finalProgram,
        majority: finalMajority,
        courseName: oldCert.course?.title || "Certificate of Achievement",
        issuedAt: nowFormatted,
        issuerId,
        instructorName,
        instructorNip,
        instructorMajor,
        customTemplatePath,
      });

      // 2. Upload to IPFS
      const newCid = await uploadToIpfs(imgBuffer, `/certs/${newCertId}.png`);

      // 3. Compute New Data Hash
      const dataString = `${finalStudentId}|${finalName}|${finalProgram}|${finalMajority}`;
      const newHash = crypto.createHash("sha256").update(dataString).digest("hex");

      // 4. Supersede on Hyperledger Fabric
      if (process.env.FABRIC_ENABLED === "true") {
        try {
          await supersedeCertificateOnFabric(oldCert.certId, newCertId, reason);
        } catch (fErr: any) {
          console.warn(`[Fabric Supersede Warning]: ${fErr.message}`);
        }

        // Issue new Certificate on Fabric
        try {
          const newFabricRecord: CertificateRecord = {
            certId: newCertId,
            studentId: finalStudentId,
            name: finalName,
            program: finalProgram,
            majority: finalMajority,
            score: (oldCert as any).score || "",
            cid: newCid,
            hash: newHash,
            status: "ISSUED",
            issuedAt: new Date().toISOString(),
            courseId: oldCert.courseId || null,
          };
          await issueCertificateOnFabric(newFabricRecord, issuerId, issuerRole);
        } catch (fErr: any) {
          console.warn(`[Fabric Issue New Warning]: ${fErr.message}`);
        }
      }

      // 5. Update Old Certificate in DB to SUPERSEDED
      await prisma.certificate.update({
        where: { id: oldCert.id },
        data: {
          status: "SUPERSEDED",
          supersededBy: newCertId,
          revocationReason: reason,
          revokedAt: new Date().toISOString(),
        },
      });

      // 6. Create New Certificate in DB
      const newCert = await prisma.certificate.create({
        data: {
          id: newCertId,
          certId: newCertId,
          studentName: finalName,
          studentId: finalStudentId,
          program: finalProgram,
          majority: finalMajority,
          courseId: oldCert.courseId,
          userId: oldCert.userId,
          cid: newCid,
          hash: newHash,
          status: "ISSUED",
          issuedAt: new Date().toISOString(),
          supersededFrom: oldCert.certId,
        },
      });

      // 7. If Request ID was provided, mark it APPROVED
      if (requestId) {
        await prisma.certificateCorrectionRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            adminNotes: `Superseded and re-issued with Certificate ID ${newCertId}. Reason: ${reason}`,
          },
        });
      }

      // 8. Optionally update User profile if requested
      if (updateUserProfile && oldCert.userId) {
        await prisma.user.update({
          where: { id: oldCert.userId },
          data: {
            ...(correctedName ? { name: correctedName } : {}),
            ...(correctedProgram ? { studyProgram: correctedProgram } : {}),
            ...(correctedMajority ? { majority: correctedMajority } : {}),
            ...(correctedStudentId ? { studentId: correctedStudentId } : {}),
          },
        });
      }

      return res.json({
        ok: true,
        message: `Certificate successfully superseded and re-issued!`,
        oldCertId: oldCert.certId,
        newCert: newCert,
      });
    } catch (err: any) {
      console.error("[CertController] supersedeCertificate Error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // --- SYNC PENDING LEDGER QUEUE TO FABRIC ---
  public async syncPendingLedger(req: Request, res: Response) {
    try {
      console.log(`[LedgerSync] Triggered by ${req.user?.identifier || "Admin"}...`);
      const result = await syncPendingCertificatesToFabric();
      return res.json({
        ok: true,
        message: `Synced ${result.successCount} of ${result.total || 0} certificates to Blockchain.`,
        data: result,
      });
    } catch (err: any) {
      console.error("[LedgerSync Error]:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // --- GET SYNC STATS FOR ADMIN DASHBOARD ---
  public async getSyncStats(req: Request, res: Response) {
    try {
      const [pendingCount, syncedCount, failedCount] = await Promise.all([
        prisma.certificate.count({ where: { blockchainSyncStatus: "PENDING_SYNC" } }),
        prisma.certificate.count({ where: { blockchainSyncStatus: "SYNCED" } }),
        prisma.certificate.count({ where: { blockchainSyncStatus: "FAILED" } }),
      ]);

      return res.json({
        ok: true,
        data: {
          pendingCount,
          syncedCount,
          failedCount,
        },
      });
    } catch (err: any) {
      console.error("[GetSyncStats Error]:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
}
