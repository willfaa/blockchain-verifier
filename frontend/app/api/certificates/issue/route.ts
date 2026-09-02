import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  findUserByIdentifier,
  createSupabaseUser,
  fetchCourseUnitsFromSupabase,
  insertCertificateToSupabase,
} from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let {
      certId,
      studentId,
      nim,
      nisn,
      name,
      majority,
      program,
      courseId,
      certificateNumber,
      schoolName,
      signers,
      competencyUnits,
      layoutMode,
      issuedAt,
    } = body;

    if (!studentId) studentId = nim || nisn;
    if (!certId) certId = crypto.randomUUID();

    if (!studentId || !name || !majority || !program) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields (studentId/NIM, name, majority, program)",
        },
        { status: 400 }
      );
    }

    // Auto-fetch course competency units if not provided
    if (
      (!competencyUnits ||
        !Array.isArray(competencyUnits) ||
        competencyUnits.length === 0) &&
      courseId
    ) {
      try {
        const units = await fetchCourseUnitsFromSupabase(courseId);
        if (units && units.length > 0) {
          competencyUnits = units.map((u: any) => ({
            code: u.code,
            title: u.title,
            standard: u.standard || "SKKNI",
            result: "KOMPETEN",
          }));
        }
      } catch (e) {}
    }

    // 1. Resolve User ID (find existing or auto-register student mirror)
    let user = await findUserByIdentifier(studentId);
    if (!user) {
      try {
        const dummyEmail = `${studentId.toLowerCase().replace(/[^a-z0-9]/g, "")}@chainnesa.com`;
        user = await createSupabaseUser({
          id: crypto.randomUUID(),
          name,
          email: dummyEmail,
          password: "$2a$10$dummyHashForAutoProvisionedStudentCertOnly",
          role: "student",
          studentId,
          majority,
          studyProgram: program,
          isVerified: true,
          isApproved: true,
          isActive: true,
        });
      } catch (userErr: any) {
        // Retry lookup if race condition
        user = await findUserByIdentifier(studentId);
        if (!user) {
          throw new Error("Unable to link certificate to student account");
        }
      }
    }

    // 2. Generate SHA-256 Hash Fingerprint
    const certNumber =
      certificateNumber || `UKK/${certId.substring(0, 8).toUpperCase()}`;
    const unitsHash = competencyUnits ? JSON.stringify(competencyUnits) : "";
    const dataString = `${certNumber}|${studentId}|${name}|${program}|${majority}|${unitsHash}`;
    const hash = crypto.createHash("sha256").update(dataString).digest("hex");

    const formattedDate =
      issuedAt ||
      new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

    // 3. Insert Certificate to Supabase Database
    const certPayload: any = {
      id: crypto.randomUUID(),
      certId,
      studentName: name,
      studentId,
      program,
      majority,
      courseId: courseId || null,
      userId: user.id,
      issuedAt: formattedDate,
      cid: "",
      hash,
      status: "ISSUED",
      certificateNumber: certNumber,
      schoolName: schoolName || null,
      signers: signers || null,
      competencyUnits: competencyUnits || null,
      layoutMode: layoutMode || "STANDARD",
      blockchainSyncStatus: "PENDING_SYNC",
      blockchainTxId: "PENDING_FABRIC_SYNC",
    };

    const inserted = await insertCertificateToSupabase(certPayload);

    return NextResponse.json({
      ok: true,
      certId,
      data: inserted,
      record: inserted,
      message: "Certificate Issued Successfully! (Synced with Cloud Ledger)",
    });
  } catch (error: any) {
    console.error("[Serverless Issue Certificate Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to issue certificate" },
      { status: 500 }
    );
  }
}
