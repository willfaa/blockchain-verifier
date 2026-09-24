import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  fetchCertificateFromSupabase,
  insertCertificateToSupabase,
  updateCertificateInSupabase,
  updateCorrectionRequestInSupabase,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      oldCertId,
      correctedName,
      correctedStudentId,
      correctedProgram,
      correctedMajority,
      reason,
      requestId,
      updateUserProfile,
    } = body;

    if (!oldCertId || !reason) {
      return NextResponse.json(
        { ok: false, error: "ID Sertifikat lama dan alasan koreksi wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Fetch old certificate from cloud database
    const oldCert: any = await fetchCertificateFromSupabase(oldCertId);
    if (!oldCert) {
      return NextResponse.json(
        { ok: false, error: "Sertifikat asli tidak ditemukan dalam sistem." },
        { status: 404 }
      );
    }

    if (oldCert.status === "SUPERSEDED") {
      return NextResponse.json(
        { ok: false, error: "Sertifikat ini sudah pernah digantikan (Superseded) sebelumnya." },
        { status: 400 }
      );
    }

    // 2. Prepare corrected data
    const finalName = (correctedName || oldCert.name || oldCert.studentName || "").trim();
    const finalStudentId = (correctedStudentId || oldCert.studentId || "").trim();
    const finalProgram = (correctedProgram || oldCert.program || "").trim();
    const finalMajority = (correctedMajority || oldCert.majority || "").trim();

    const newCertId = crypto.randomUUID();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    // 3. Compute Cryptographic SHA-256 Hash
    const certNumber = oldCert.certificateNumber || `UKK/${newCertId.substring(0, 8).toUpperCase()}`;
    const dataString = `${certNumber}|${finalStudentId}|${finalName}|${finalProgram}|${finalMajority}`;
    const newHash = crypto.createHash("sha256").update(dataString).digest("hex");
    const newCid = `Qm${newHash.substring(0, 44)}`;

    // 4. Update Old Certificate to SUPERSEDED
    await updateCertificateInSupabase(oldCert.certId || oldCert.id, {
      status: "SUPERSEDED",
      supersededBy: newCertId,
      revocationReason: reason,
      revokedAt: new Date().toISOString(),
    });

    // 5. Insert New Certificate Record
    const newCertRecord = {
      id: crypto.randomUUID(),
      certId: newCertId,
      studentName: finalName,
      studentId: finalStudentId,
      program: finalProgram,
      majority: finalMajority,
      courseId: oldCert.courseId || null,
      userId: oldCert.userId || null,
      issuedAt: formattedDate,
      cid: newCid,
      hash: newHash,
      status: "ISSUED",
      certificateNumber: oldCert.certificateNumber || null,
      schoolName: oldCert.schoolName || null,
      signers: oldCert.signers ? (typeof oldCert.signers === "string" ? oldCert.signers : JSON.stringify(oldCert.signers)) : null,
      competencyUnits: oldCert.competencyUnits ? (typeof oldCert.competencyUnits === "string" ? oldCert.competencyUnits : JSON.stringify(oldCert.competencyUnits)) : null,
      layoutMode: oldCert.layoutMode || "STANDARD",
      blockchainSyncStatus: "PENDING_SYNC",
      blockchainTxId: "PENDING_FABRIC_SYNC",
      supersededFrom: oldCert.certId || oldCert.id,
    };

    const inserted = await insertCertificateToSupabase(newCertRecord);

    // 6. Update Correction Request if provided
    if (requestId) {
      await updateCorrectionRequestInSupabase(requestId, {
        status: "APPROVED",
        adminNotes: `Superseded and re-issued with Certificate ID ${newCertId}. Reason: ${reason}`,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Sertifikat berhasil digantikan (Superseded) dan diterbitkan ulang!",
      oldCertId: oldCert.certId || oldCert.id,
      newCert: inserted || newCertRecord,
      record: inserted || newCertRecord,
      certId: newCertId,
    });
  } catch (err: any) {
    console.error("[Serverless Supersede Error]:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Gagal melakukan supersede sertifikat." },
      { status: 500 }
    );
  }
}
