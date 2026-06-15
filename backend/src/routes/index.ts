// backend/src/routes/index.ts
import { Router } from "express";

// Import Pecahan Routes
import lmsRoutes from "./lmsRoutes";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import explorerRoutes from "./explorerRoutes";
import { CertificateController } from "../controllers/certificateController";

// Core Middlewares
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();
const certController = new CertificateController();

// Gabungkan disini dengan prefix yang rapi
router.use("/auth", authRoutes);

// Secured Certificate Routes
router.get("/certificates/my-certificates", verifyToken, (req, res) =>
  certController.getMyCertificates(req, res)
);
router.get("/certificates/:id", (req, res) =>
  certController.getCertificate(req, res)
);

router.use("/lms", lmsRoutes);
router.use("/admin", adminRoutes);
router.use("/explorer", explorerRoutes);

export default router;
