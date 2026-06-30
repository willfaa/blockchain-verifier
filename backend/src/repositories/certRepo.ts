import { db } from "../config/db";
import { CertificateRecord } from "../types";

// Helper: Ubah snake_case DB ke camelCase App
// Helper: Ubah snake_case DB ke camelCase App
const mapRowToCert = (row: any): CertificateRecord => {
  return {
    // Pastikan mapping ini sesuai dengan nama kolom di DB Anda
    certId: row.cert_id || row.id,
    studentId: row.studentId || row.nisn,
    name: row.name,
    majority: row.majority,
    program: row.program,
    cid: row.cid,
    hash: row.hash,
    status: row.status,
    issuedAt: row.issued_at,
    nonce: row.nonce,
    revokedAt: row.revoked_at,
    revocationReason: row.revocation_reason,
    supersededBy: row.superseded_by,
    courseId: row.courseId,
  };
};

export const saveCertificate = async (cert: CertificateRecord) => {
  console.log(
    "Saving to DB via Prisma. certId:",
    cert.certId,
    "| Status:",
    cert.status,
  );

  /*
   * CRITICAL: The Schema requires `userId`.
   * I will assume we need to find the user by Student ID.
   */

  const user = await db.user.findFirst({ where: { studentId: cert.studentId } });
  if (!user) {
    console.warn(
      `User with Student ID ${cert.studentId} not found. Cannot link certificate to user.`,
    );
    throw new Error(
      `User with Student ID ${cert.studentId} not found. Certificate requires a valid User.`,
    );
  }

  await db.certificate.upsert({
    where: {
      certId: cert.certId,
    },
    update: {
      status: cert.status,
      hash: cert.hash,
      cid: cert.cid,
      studentId: cert.studentId, // Persist Student ID
      courseId: cert.courseId,
    },
    create: {
      certId: cert.certId,
      studentName: cert.name,
      studentId: cert.studentId,
      program: cert.program,
      majority: cert.majority,
      cid: cert.cid,
      hash: cert.hash,
      status: cert.status,
      issuedAt: cert.issuedAt,
      userId: user.id,
      courseId: cert.courseId,
    },
  });
};

export const findCertificateById = async (
  certId: string,
): Promise<CertificateRecord | null> => {
  const cert = await db.certificate.findUnique({
    where: { certId },
  });

  if (!cert) return null;

  return {
    certId: cert.certId,
    studentId: cert.studentId,
    name: cert.studentName, // Mapped from studentName
    majority: cert.majority,
    program: cert.program,
    cid: cert.cid,
    hash: cert.hash,
    status: cert.status,
    issuedAt: cert.issuedAt,
    nonce: "0", // Default string "0" as nonce is missing in DB but required in type
    courseId: cert.courseId,
    revokedAt: undefined,
    revocationReason: undefined,
    supersededBy: undefined,
  } as CertificateRecord;
};

export const revokeCertificate = async (certId: string, reason: string) => {
  /*
   * WARNING: The current Prisma Schema for Certificate does NOT have 'revokedAt' or 'revocationReason'.
   * I will update the status to 'REVOKED'.
   * If these fields are strict requirements, the schema needs updating.
   * For now, I will just update the status.
   */
  await db.certificate.update({
    where: { certId },
    data: {
      status: "REVOKED",
      // revokedAt: new Date(), // Not in schema
      // revocationReason: reason // Not in schema
    },
  });
};
