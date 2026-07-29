// @ts-nocheck
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import * as QRCode from "qrcode";
import {
  issueCertificateOnFabric,
  revokeCertificateOnFabric,
  getAllCertificatesFromFabric,
} from "../fabric/client";
import {
  saveCertificate,
  revokeCertificate as revokeCertificateRepo,
} from "../repositories/certRepo";
import { db } from "../config/db";
import { CertificateRecord } from "../types";
import { generateCertificateImage } from "../services/imageGenerator";
import { uploadToIpfs } from "../utils/ipfs";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

export class CertificateController {
  /**
   * getMyCertificates - High Resilience Implementation
   * Fetches certificates for the logged-in student.
   * Handles null hashes, missing courses, and search filters.
   */
  public async getMyCertificates(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user?.id || req.user?.userId;
      if (!userId) {
        return res
          .status(401)
          .json({ error: "Access Denied: No User Session" });
      }

      const { search } = req.query;

      // Robust Query with nested search if requested
      const certificates = await db.certificate.findMany({
        where: {
          userId,
          status: "ISSUED",
          ...(search
            ? {
                course: {
                  title: { contains: String(search), mode: "insensitive" },
                },
              }
            : {}),
        },
        include: {
          course: {
            select: { id: true, title: true, imageUrl: true },
          },
        },
        orderBy: { issuedAt: "desc" },
      });

      // Data Sanitization / Null Safety Guard
      const safeData = certificates.map((cert) => ({
        ...cert,
        hash: cert.hash || "Not_Available_On_Chain",
        issuedAt: cert.issuedAt || new Date().toISOString(),
        course: cert.course || {
          id: cert.courseId || "unknown",
          title: "Archived_or_Deleted_Course",
          imageUrl: null,
        },
      }));

      return res.status(200).json({ ok: true, data: safeData });
    } catch (error: any) {
      console.error("[CertController] getMyCertificates Error:", error.message);
      // Return 200 with empty array to prevent frontend crash even on DB error
      return res.status(200).json({
        ok: true,
        data: [],
        error: "Partial recovery: Database unreachable",
      });
    }
  }

  public async getCertificate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const certificate = await db.certificate.findFirst({
        where: { OR: [{ id }, { certId: id }] },
        include: {
          course: { select: { title: true, id: true, imageUrl: true } },
          user: { select: { name: true, email: true } },
        },
      });

      if (!certificate)
        return res.status(404).json({ error: "Certificate not found" });

      return res.json({ ok: true, record: certificate });
    } catch (error: any) {
      console.error("[CertController] getCertificate Error:", error.message);
      return res.status(500).json({ error: "Retrieval failed" });
    }
  }

  public async issueCertificate(req: Request, res: Response) {
    try {
      // @ts-ignore
      const issuerId = req.user?.id || "SYSTEM";
      // @ts-ignore
      const issuerRole = req.user?.role || "TEACHER";

      // Check HLF Health if enabled
      if (process.env.FABRIC_ENABLED === "true") {
        try {
          const { checkFabricReady } = require("../fabric/client");
          await checkFabricReady(issuerId, issuerRole);
        } catch (err: any) {
          console.error("[Issue] Fabric offline check failed:", err.message);
          return res.status(503).json({
            error: "Blockchain Network Offline. Please try again when the ledger service is active.",
          });
        }
      }

      let { certId, studentId, nisn, nim, name, majority, program, issuedAt, score } = req.body;

      if (!studentId) studentId = nisn || nim;

      if (!certId) certId = uuidv4();

      if (!studentId || !name || !majority || !program) {
        return res
          .status(400)
          .json({ error: "Missing required identity fields" });
      }

      // Map Student ID to DB User ID (UUID) if exists
      const user = await db.user.findFirst({
        where: {
          OR: [
            { id: studentId },
            { studentId: studentId },
            { email: studentId }
          ]
        }
      });
      const finalStudentId = user ? user.id : studentId;

      const dataString = `${finalStudentId}|${name}|${program}|${majority}`;
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      const imgBuffer = await generateCertificateImage({
        certId,
        name,
        studentId: finalStudentId,
        program,
        majority,
        courseName: "General Verification",
        issuedAt: issuedAt || new Date().toISOString(),
        issuerId,
      });

      const cid = await uploadToIpfs(imgBuffer, `/certs/${certId}.png`);

      const record = await db.certificate.create({
        data: {
          id: certId,
          certId,
          studentName: name,
          studentId: finalStudentId,
          program,
          majority,
          cid,
          hash,
          status: "ISSUED",
          issuedAt: issuedAt || new Date().toISOString(),
          userId: user ? user.id : "SYSTEM_GEN",
        },
      });

      // Fabric sync in background to prevent request timeout
      issueCertificateOnFabric(
        { ...record, score: score || "" } as any,
        issuerId,
        issuerRole,
      ).catch((err) => console.error("[Fabric] Background Issue Error:", err));

      return res.json({ ok: true, record });
    } catch (error: any) {
      console.error("[CertController] issueCertificate Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  public async revokeCertificate(req: Request, res: Response) {
    try {
      const { certId, reason } = req.body;
      if (!certId || !reason)
        return res.status(400).json({ error: "Missing ID or reason" });

      await db.certificate.update({
        where: { certId },
        data: { status: "REVOKED" },
      });

      const revokedAt = new Date().toISOString();
      await revokeCertificateOnFabric(certId, reason, revokedAt);

      return res.json({ ok: true, message: "Revocation recorded on-chain" });
    } catch (error: any) {
      console.error("[CertController] revokeCertificate Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  public async claimCertificate(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user?.id || req.user?.userId;
      const { courseId } = req.body;

      if (!userId || !courseId)
        return res.status(400).json({ error: "Context missing" });

      // Check HLF Health if enabled
      if (process.env.FABRIC_ENABLED === "true") {
        try {
          const { checkFabricReady } = require("../fabric/client");
          await checkFabricReady("SYSTEM", "TEACHER");
        } catch (err: any) {
          console.error("[Claim] Fabric offline check failed:", err.message);
          return res.status(503).json({
            error: "Blockchain Network Offline. Please try again when the ledger service is active.",
          });
        }
      }

      const enrollment = await db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { user: true, course: { include: { user: true } } },
      });

      if (!enrollment)
        return res.status(404).json({ error: "Enrollment not found" });

      const student = enrollment.user;
      const course = enrollment.course;

      // Pass Check
      const moduleWithExam = await db.module.findFirst({
        where: { courseId },
        include: { exams: true },
      });
      const exam = moduleWithExam?.exams?.[0];
      if (!exam)
        return res.status(400).json({ error: "No exam found for course" });

      const result = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: userId, status: "PASSED" },
      });
      if (!result)
        return res.status(403).json({ error: "Exam requirements not met" });

      const certId = uuidv4();
      const hash = crypto
        .createHash("sha256")
        .update(
          `${student.id}|${student.name}|${student.studyProgram}|${student.majority}`,
        )
        .digest("hex");

      const path = require("path");
      const issuedAtFormatted = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

      const imgBuffer = await generateCertificateImage({
        certId,
        name: student.name,
        courseName: course.title,
        majority: student.majority || "N/A",
        program: student.studyProgram || "N/A",
        issuedAt: issuedAtFormatted,
        issuerId: (course as any).user?.id || "SYSTEM",
        studentId: student.id, // User ID mapped here!
        instructorName: (course as any).user?.name || "Head Instructor",
        instructorNip: (course as any).user?.nip || "-",
        instructorMajor: (course as any).user?.majority || "Department of Informatics",
        customTemplatePath: course.certificateTemplate || undefined,
      });

      const cid = await uploadToIpfs(imgBuffer, `/certs/claims/${certId}.png`);

      const cert = await db.certificate.create({
        data: {
          id: certId,
          certId,
          userId,
          studentName: student.name,
          studentId: student.id,
          program: student.studyProgram || "N/A",
          majority: student.majority || "N/A",
          courseId,
          cid,
          hash,
          status: "ISSUED",
          issuedAt: new Date().toISOString(),
        },
      });

      // Update Enrollment
      await db.enrollment.update({
        where: { id: enrollment.id },
        data: {
          certificateId: cert.id,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Fabric sync
      issueCertificateOnFabric(
        { ...cert, score: String((result as any).score || "") } as any,
        "SYSTEM",
        "TEACHER",
      ).catch((err) => console.error("[Fabric] Claim Sync Error:", err));

      return res.json({ ok: true, certId, cid });
    } catch (error: any) {
      console.error("[CertController] claimCertificate Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  public async getAllCertificates(req: Request, res: Response) {
    try {
      // @ts-ignore
      const username = req.user?.identifier || "admin";
      // @ts-ignore
      const role = req.user?.role || "admin";
      const data = await getAllCertificatesFromFabric(username, role);
      return res.json({ ok: true, data });
    } catch (error: any) {
      console.error(
        "[CertController] getAllCertificates (Fabric) Error:",
        error.message,
      );
      return res.status(500).json({ error: "On-chain retrieval failed" });
    }
  }

  public async downloadCertificatePdf(req: Request, res: Response) {
    try {
      const certId = req.params.id;
      const certificate = await db.certificate.findFirst({
        where: { OR: [{ id: certId }, { certId }] },
        include: {
          course: {
            include: { user: true }
          },
          user: true
        }
      });

      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      const layoutSetting = await db.systemSetting.findUnique({
        where: { key: "certificate_layout" },
      });
      const layout = (layoutSetting?.value as "HORIZONTAL" | "VERTICAL") || "HORIZONTAL";
      const isVertical = layout === "VERTICAL";

      const issuedAtFormatted = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(certificate.issuedAt));

      const path = require("path");

      // Generate the high-res PNG image first
      const imgBuffer = await generateCertificateImage({
        certId: certificate.certId,
        name: certificate.studentName,
        courseName: certificate.course?.title || "Program Completion",
        majority: certificate.majority,
        program: certificate.program,
        issuedAt: issuedAtFormatted,
        issuerId: certificate.course?.user?.id || "SYSTEM",
        studentId: certificate.studentId, // Already mapped to User ID in db
        instructorName: certificate.course?.user?.name || "Head Instructor",
        instructorNip: certificate.course?.user?.nip || "-",
        instructorMajor: certificate.course?.user?.majority || "Department of Informatics",
        layout,
        customTemplatePath: certificate.course?.certificateTemplate || undefined,
      });

      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument({
        size: "A4",
        layout: isVertical ? "portrait" : "landscape",
        margin: 0,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="certificate-${certificate.certId}.pdf"`
      );
      doc.pipe(res);

      doc.image(imgBuffer, 0, 0, {
        width: isVertical ? 595.28 : 841.89,
        height: isVertical ? 841.89 : 595.28,
      });

      doc.end();
    } catch (err: any) {
      console.error("[CertController] downloadCertificatePdf Error:", err.message);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to generate PDF document" });
      }
    }
  }
}
