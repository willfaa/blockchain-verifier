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

// --- PUBLIC ROUTES (Bisa diakses siapa saja) ---

// D. Verify Certificate (Read from Blockchain)
router.get("/:id/verify", getCertificateFromChain);

// E. Get Certificate Details (From DB/Local if needed)
router.get("/:id", (req, res) => certController.getCertificate(req, res));

export default router;
