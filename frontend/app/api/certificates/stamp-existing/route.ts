import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  findUserByIdentifier,
  createSupabaseUser,
  insertCertificateToSupabase,
  uploadToSupabaseStorage,
} from "@/lib/supabase";
import { pinFileToPinata, createSha256Cid } from "@/lib/ipfs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    let page1Buffer: Buffer | null = null;
    let page2Buffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const page1File = formData.get("page1") as File | null;
      const page2File = formData.get("page2") as File | null;

      if (page1File) {
        const bytes = await page1File.arrayBuffer();
        page1Buffer = Buffer.from(bytes);
      }

      if (page2File) {
        const bytes = await page2File.arrayBuffer();
        page2Buffer = Buffer.from(bytes);
      }

      // Read form text fields
      formData.forEach((value, key) => {
        if (key !== "page1" && key !== "page2") {
          body[key] = value;
        }
      });
    } else {
      body = await request.json();
      if (body.page1Base64) {
        const clean1 = body.page1Base64.replace(/^data:image\/\w+;base64,/, "");
        page1Buffer = Buffer.from(clean1, "base64");
      }
      if (body.page2Base64) {
        const clean2 = body.page2Base64.replace(/^data:image\/\w+;base64,/, "");
        page2Buffer = Buffer.from(clean2, "base64");
      }
    }

    const studentName = (body.name || body.studentName || "").trim();
    const studentId = (body.studentId || body.nim || body.nisn || "").trim();
    const certId =
      body.certId ||
      `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const majority = body.majority || "Teknik Komputer dan Jaringan";
    const program = body.program || "Uji Kompetensi Keahlian (UKK)";
    const courseId = body.courseId || null;
    const certificateNumber = body.certificateNumber || null;
    const schoolName = body.schoolName || null;
    let signers = body.signers || null;
    let competencyUnits = body.competencyUnits || null;
    const issuedAt = body.issuedAt || null;

    if (typeof signers === "string") {
      try {
        signers = JSON.parse(signers);
      } catch (e) {}
    }
    if (typeof competencyUnits === "string") {
      try {
        competencyUnits = JSON.parse(competencyUnits);
      } catch (e) {}
    }

    if (!studentId || !studentName) {
      return NextResponse.json(
        {
          ok: false,
          error: "NISN / Student ID dan Nama Siswa wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Helper for image format detection
    const detectImageMime = (buf: Buffer) => {
      const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
      return {
        mime: isJpeg ? "image/jpeg" : "image/png",
        ext: isJpeg ? "jpg" : "png",
      };
    };

    // 1. Resolve User in Supabase (Guarantees valid userId to satisfy foreign key & NOT NULL constraint)
    let user = await findUserByIdentifier(studentId);
    if (!user) {
      try {
        const sanitizedId = studentId.toLowerCase().replace(/[^a-z0-9]/g, "") || `std${Date.now()}`;
        const dummyEmail = `${sanitizedId}@chainnesa.com`;
        user = await createSupabaseUser({
          id: crypto.randomUUID(),
          name: studentName,
          email: dummyEmail,
          password: await bcrypt.hash(studentId, 10),
          role: "student",
          studentId,
          majority,
          studyProgram: program,
          isVerified: true,
          isApproved: true,
          isActive: true,
        });
      } catch (userErr: any) {
        user = await findUserByIdentifier(studentId);
      }
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Gagal menemukan atau membuat profil akun siswa di database." },
        { status: 400 }
      );
    }

    const userId = user.id;

    // 2. Upload Page 1 and Page 2 (if present) to Supabase Storage
    let frontUrl = "";
    let transcriptUrl = "";

    if (page1Buffer) {
      const { mime, ext } = detectImageMime(page1Buffer);
      const uploaded1 = await uploadToSupabaseStorage(
        page1Buffer,
        `certificates/${certId}_front.${ext}`,
        mime,
        "lms"
      );
      if (uploaded1) frontUrl = uploaded1;
    }

    if (page2Buffer) {
      const { mime, ext } = detectImageMime(page2Buffer);
      const uploaded2 = await uploadToSupabaseStorage(
        page2Buffer,
        `certificates/${certId}_transcript.${ext}`,
        mime,
        "lms"
      );
      if (uploaded2) transcriptUrl = uploaded2;
    }

    // 3. Compute Cryptographic SHA-256 Hash
    let hash = "";
    if (page1Buffer) {
      hash = crypto.createHash("sha256").update(page1Buffer).digest("hex");
    } else {
      const certNumber =
        certificateNumber || `UKK/${certId.substring(0, 8).toUpperCase()}`;
      const dataString = `${certNumber}|${studentId}|${studentName}|${program}|${majority}`;
      hash = crypto.createHash("sha256").update(dataString).digest("hex");
    }

    const formattedDate =
      issuedAt ||
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

    // 4. Pin Certificate Image Directly to Pinata IPFS (Primary Decentralized Storage)
    let ipfsCid = "";
    if (page1Buffer) {
      const { mime, ext } = detectImageMime(page1Buffer);
      try {
        console.log(`[IPFS] Pinning Stamped Certificate Image for ${certId} directly to Pinata...`);
        ipfsCid = await pinFileToPinata(page1Buffer, `${certId}_front.${ext}`, mime);
      } catch (ipfsErr: any) {
        console.warn("[IPFS Direct Image Pinning Note]:", ipfsErr.message);
      }
    }

    // Also pin transcript image if present
    let transcriptCid = "";
    if (page2Buffer) {
      const { mime, ext } = detectImageMime(page2Buffer);
      try {
        transcriptCid = await pinFileToPinata(page2Buffer, `${certId}_transcript.${ext}`, mime);
      } catch (e: any) {}
    }

    // Fallback spec-compliant Base58 multihash CID if pinning was skipped or failed
    if (!ipfsCid) {
      ipfsCid = createSha256Cid(page1Buffer || hash);
    }

    const cid = ipfsCid;
    const txId = "PENDING_FABRIC_SYNC";

    let formattedUnits = competencyUnits;
    if (page2Buffer && !competencyUnits) {
      formattedUnits = {
        isTranscriptImage: true,
        transcriptCid: transcriptCid || undefined,
        transcriptUrl: transcriptUrl || (transcriptCid ? `/api/ipfs/${transcriptCid}` : undefined),
      };
    }

    // 5. Insert to Supabase DB
    const certRecord = {
      id: crypto.randomUUID(),
      certId,
      studentName,
      studentId,
      program,
      majority,
      courseId,
      userId,
      issuedAt: formattedDate,
      cid,
      hash,
      status: "ISSUED",
      certificateNumber,
      schoolName,
      signers: signers ? JSON.stringify(signers) : null,
      competencyUnits: formattedUnits ? JSON.stringify(formattedUnits) : null,
      layoutMode: page2Buffer ? "DUPLEX_2_PAGES" : "PRE_ISSUED_STAMP",
      blockchainSyncStatus: "PENDING_SYNC",
      blockchainTxId: txId,
      syncedAt: null,
    };

    const inserted = await insertCertificateToSupabase(certRecord);
    if (!inserted) {
      throw new Error("Failed to insert certificate record to database");
    }

    const clientBase =
      process.env.NEXT_PUBLIC_CLIENT_URL || "https://www.willfaa.web.id";
    const verificationUrl = `${clientBase}/verify/${certId}`;

    return NextResponse.json({
      ok: true,
      message: "Sertifikat Berhasil Diamankan & Masuk Antrean Ledger Blockchain!",
      certId,
      hash,
      txId,
      cid,
      frontUrl: frontUrl || (cid ? `/api/ipfs/${cid}` : ""),
      transcriptUrl: transcriptUrl || (transcriptCid ? `/api/ipfs/${transcriptCid}` : undefined),
      verificationUrl,
      record: certRecord,
    });
  } catch (error: any) {
    console.error("[API Stamp Existing Certificate Error]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Failed to stamp and secure certificate",
      },
      { status: 500 }
    );
  }
}
