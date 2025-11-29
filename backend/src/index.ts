import express from "express";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import { uploadToIpfs } from "./ipfs";
import {
  issueCertificateOnFabric,
  getCertificateFromFabric,
  getCertificatesFromFabric,
} from "./fabric";
import { CertificateRecord } from "./types";
import { saveCertificate, findCertificateById } from "./certRepo";
import { getAllCourses } from "./courseRepo";
import { testConnection } from "./db";

const app = express();
const REQUIRE_DB = process.env.REQUIRE_DB === "true";

// general middleware
app.use(cors());
app.use(express.json());

// multer config: store files in memory (buffer), not on disk
const upload = multer({
  storage: multer.memoryStorage(),
});

// server health route
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Credential verification backend is live",
  });
});

// PostgreSQL connectivity check
app.get("/db-check", async (req, res) => {
  try {
    await testConnection();
    res.json({ ok: true, message: "PostgreSQL connection succeeded" });
  } catch (err: any) {
    console.error("DB connection error:", err);
    res.status(500).json({
      ok: false,
      message: "Failed to connect to PostgreSQL",
      detail: err.message,
    });
  }
});

// test route: fetch all certificates from chaincode 'basic' (GetAllCertificates)
app.get("/fabric/certificates", async (req, res) => {
  try {
    const list = await getCertificatesFromFabric();
    res.json({ count: list.length, certificates: list });
  } catch (err: any) {
    console.error("GetCertificatesFromFabric error:", err);
    res.status(500).json({
      error: "Fail get certificates from Fabric",
      detail: err.message,
    });
  }
});

// course listing route
app.get("/courses", async (_req, res) => {
  try {
    const courses = await getAllCourses();
    res.json({ courses });
  } catch (err: any) {
    console.error("Error at /courses:", err);
    res.status(500).json({
      error: "Failed to fetch courses",
      detail: err.message,
    });
  }
});

// certificate issuance route (accepts file upload)
// file field from the frontend is named "file"
app.post("/issue", upload.single("file"), async (req, res) => {
  try {
    console.log("Body /issue:", req.body);
    console.log("File /issue:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "File ijazah belum dikirim" });
    }

    // If the DB in strict mode: check the connection before continue
    if (REQUIRE_DB) {
      try {
        await testConnection();
      } catch (dbErr: any) {
        console.error("DB NOT READY (REQUIRE_DB=true):", dbErr);
        return res.status(503).json({
          error: "Database is not ready. credential is rejected",
          detail: dbErr.message,
        });
      }
    }

    const { name, program, nim, majority } = req.body;

    if (!name || !program || !nim || !majority) {
      return res.status(400).json({
        error: "Field name, nim, majority, and program must be filled ",
      });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const size = req.file.size;

    console.log(`Receiving file ${originalName} with the size ${size} bytes`);

    // 1. create certId & issuedAt
    const certId = "CERT-" + Date.now();
    const issuedAt = new Date().toISOString();

    // 2. Path MFS uses certId
    const mfsPath = `/certs/${certId}-${originalName}`;

    // 3. Upload to IPFS + write to MFS
    const cid = await uploadToIpfs(fileBuffer, mfsPath);
    console.log("CID dari IPFS:", cid);

    // 4. count hash file
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    console.log("SHA-256 hash:", hash);

    // 5. Make a record
    const record: CertificateRecord = {
      certId,
      nim,
      name,
      majority,
      program,
      cid,
      hash,
      status: "ACTIVE",
      issuedAt,
    };

    // 6. STRICT: Must be Succeeded in fabric
    try {
      await issueCertificateOnFabric(record);
      console.log("Certificate succesfully issued to Fabric.");
    } catch (fabricErr: any) {
      console.error("Fail issue to Fabric (STRICT):", fabricErr);
      return res.status(502).json({
        error: "Fail issuing to fabric. Issuing cancelled.",
        detail: fabricErr.message,
      });
    }

    // 7. Save metadata to PostgreSQL (cache). If fail, not cancelling issuing,
    // Because Fabric has become the primary source of truth.
    try {
      await saveCertificate(record);
      console.log("Metadata certificate saved in PostgreSQL");
    } catch (dbErr: any) {
      console.error(
        "Failed to save metadata to PostgreSQL :(Fabric already succeeded)",
        dbErr
      );
    }

    // 8. Response to the client - canonical source: Fabric + IPFS
    res.json({
      ...record,
      fileName: originalName,
      size,
      onChain: true,
      note: "Certificates are issued to Fabric (the primary source) and files are stored on IPFS. The DB metadata is cached.",
    });
  } catch (err: any) {
    console.error("Error at /issue:", err);
    res.status(500).json({
      error: "An error occured on the server /issue",
      detail: err.message,
    });
  }
});

// admin route: backfill metadata into DB for files already in IPFS
app.post("/admin/backfill", async (req, res) => {
  try {
    const { certId, nim, name, majority, program, cid, hash, issuedAt } =
      req.body;

    if (!certId || !nim || !name || !majority || !program || !cid || !hash) {
      return res.status(400).json({
        error:
          "Field certId, nim, name, majority, program, cid, and hash must be filled for backfill.",
      });
    }

    const record: CertificateRecord = {
      certId,
      nim,
      name,
      majority,
      program,
      cid,
      hash,
      status: "ACTIVE",
      issuedAt: issuedAt || new Date().toISOString(),
    };

    await saveCertificate(record);

    res.json({
      ok: true,
      message: "Metadata successfully backfilled to PostgreSQL.",
      record,
    });
  } catch (err: any) {
    console.error("Error at /admin/backfill:", err);
    res.status(500).json({
      error: "Fail backfilling metadata to PostgreSQL",
      detail: err.message,
    });
  }
});

// verification route
app.post("/verify", async (req, res) => {
  try {
    const { certId } = req.body;
    if (!certId) {
      return res.status(400).json({ error: "certId must be filled" });
    }

    // 1. Ambil dari Fabric (WAJIB)
    const recordFab = await getCertificateFromFabric(certId);
    if (!recordFab) {
      return res.status(404).json({
        error: "Certificate is not found in fabric.",
      });
    }

    // 2. Ambil dari DB (opsional, tapi dipakai untuk konsistensi)
    let recordDb: CertificateRecord | null = null;
    try {
      recordDb = await findCertificateById(certId);
    } catch (dbErr: any) {
      console.error("Gagal ambil dari DB saat verify:", dbErr);
      // Tidak menggagalkan verifikasi; Fabric tetap sumber utama.
    }

    const dbFound = !!recordDb;
    const dbMismatch =
      recordDb && recordDb.hash !== recordFab.hash ? true : false;

    let note: string;
    if (!dbFound) {
      note =
        "Certificate terverifikasi di Fabric. Metadata DB tidak ditemukan (perlu sinkronisasi).";
    } else if (dbMismatch) {
      note =
        "Certificate terverifikasi di Fabric, tetapi hash di DB tidak sama. Gunakan Fabric sebagai sumber kebenaran.";
    } else {
      note = "Certificate terverifikasi di Fabric dan konsisten dengan DB.";
    }

    // 3. Response: field certificate di-flatten ke root (biar frontend tidak perlu dirombak besar)
    res.json({
      ...recordFab,
      onChain: true,
      dbFound,
      dbMismatch,
      note,
    });
  } catch (err: any) {
    console.error("Error di /verify:", err);
    res.status(500).json({
      error: "An error occured in server /verify",
      detail: err.message,
    });
  }
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(
    `Backend listening on http://localhost:${PORT} (STRICT Fabric mode)`
  );
});
