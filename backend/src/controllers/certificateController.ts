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

      let { certId, nisn, name, majority, program, issuedAt, nonce } = req.body;

      if (!certId) certId = uuidv4();
      if (!nonce) nonce = crypto.randomBytes(16).toString("hex");

      if (!nisn || !name || !majority || !program) {
        return res
          .status(400)
          .json({ error: "Missing required identity fields" });
      }

      const dataString = `${nisn}|${name}|${program}|${majority}`;
      const hash = crypto.createHash("sha256").update(dataString).digest("hex");

      const imgBuffer = await generateCertificateImage({
        certId,
        name,
        nisn,
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
          nisn,
          program,
          majority,
          cid,
          hash,
          status: "ISSUED",
          issuedAt: issuedAt || new Date().toISOString(),
          userId: "SYSTEM_GEN", // Generic placeholder or actual link
        },
      });

      // Fabric sync in background to prevent request timeout
      issueCertificateOnFabric(
        { ...record, nonce } as any,
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
          `${student.nisn}|${student.name}|${student.studyProgram}|${student.majority}`,
        )
        .digest("hex");

      const imgBuffer = await generateCertificateImage({
        certId,
        name: student.name,
        courseName: course.title,
        majority: student.majority || "N/A",
        program: student.studyProgram || "N/A",
        issuedAt: new Date().toISOString(),
        issuerId: (course as any).user?.id || "SYSTEM",
        nisn: student.nisn || "N/A",
      });

      const cid = await uploadToIpfs(imgBuffer, `/certs/claims/${certId}.png`);

      const cert = await db.certificate.create({
        data: {
          id: certId,
          certId,
          userId,
          studentName: student.name,
          nisn: student.nisn || "N/A",
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
        { ...cert, nonce: crypto.randomBytes(8).toString("hex") } as any,
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
}
