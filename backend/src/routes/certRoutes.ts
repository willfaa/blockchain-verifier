// backend/src/routes/certRoutes.ts
import { Router } from "express";
import { CertController } from "../controllers/certController";
import {
  verifyToken,
  verifyAdmin,
  verifyIssuer, // (Admin OR Teacher)
} from "../middleware/authMiddleware";
import { getCertificateFromChain } from "../controllers/issueController";

const router = Router();
const certController = new CertController();

// --- PROTECTED ROUTES (Butuh Login) ---

// A. Get All Certificates (Dashboard Teacher/Admin)
router.get("/", verifyToken, verifyIssuer, (req, res) =>
  certController.getAllCertificates(req, res)
);

// B. Issue Certificate
router.post("/issue", verifyToken, verifyIssuer, (req, res) =>
  certController.issueCertificate(req, res)
);

// B1. Preview Certificate
router.post("/preview", verifyToken, verifyIssuer, (req, res) =>
  certController.previewCertificate(req, res)
);

// B2. Claim Certificate (Student)
router.post("/claim", verifyToken, (req, res) =>
  certController.claimCertificate(req, res)
);

// B3. Get My Certificates (Student)
router.get("/my-certificates", verifyToken, (req, res) =>
  certController.getMyCertificates(req, res)
);

// C. Revoke Certificate
router.post("/revoke", verifyToken, verifyAdmin, (req, res) =>
  certController.revokeCertificate(req, res)
);

// C1. Automated Data Drift & Discrepancies (Admin / Teacher)
router.get("/discrepancies", verifyToken, verifyIssuer, (req, res) =>
  certController.getDiscrepancies(req, res)
);

// C2. Student Self-Service Request Correction (Student)
router.post("/request-correction", verifyToken, (req, res) =>
  certController.requestCorrection(req, res)
);

// C3. Get Correction Requests (Admin / Teacher)
router.get("/correction-requests", verifyToken, verifyIssuer, (req, res) =>
  certController.getCorrectionRequests(req, res)
);

// C4. Supersede / Re-Issue Certificate with Corrected Data (Admin / Teacher)
router.post("/supersede", verifyToken, verifyIssuer, (req, res) =>
  certController.supersedeCertificate(req, res)
);

// C5. Sync Pending Mirror Ledger to Blockchain (Admin / Teacher)
router.post("/sync-ledger", verifyToken, verifyIssuer, (req, res) =>
  certController.syncPendingLedger(req, res)
);

// C6. Get Sync Queue Stats (Admin / Teacher)
router.get("/sync-stats", verifyToken, verifyIssuer, (req, res) =>
  certController.getSyncStats(req, res)
);

// --- PUBLIC ROUTES (Bisa diakses siapa saja) ---

// D. Verify Certificate (Read from Blockchain)
router.get("/:id/verify", getCertificateFromChain);

// E. Get Certificate Details (From DB/Local if needed)
router.get("/:id", (req, res) => certController.getCertificate(req, res));

export default router;
