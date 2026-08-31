// backend/src/routes/index.ts
import { Router } from "express";

// Import Pecahan Routes
import lmsRoutes from "./lmsRoutes";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import explorerRoutes from "./explorerRoutes";
import certRoutes from "./certRoutes";
import { CertificateController } from "../controllers/certificateController";

// Core Middlewares
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();
const certController = new CertificateController();

// Gabungkan disini dengan prefix yang rapi
router.use("/auth", authRoutes);

// Public System Status Check (for health indicator)
router.get("/system/status", async (req, res) => {
  let isFabricOnline = false;
  if (process.env.FABRIC_ENABLED === "true") {
    try {
      const { checkFabricReady } = require("../fabric/client");
      await checkFabricReady("admin", "admin");
      isFabricOnline = true;
    } catch (e) {
      // offline
    }
  }
  return res.json({
    ok: true,
    blockchainOnline: isFabricOnline,
  });
});

// Certificate Routes (Full Suite + PDF fallback)
router.get("/certificates/:id/pdf", (req, res) =>
  certController.downloadCertificatePdf(req, res)
);
router.use("/certificates", certRoutes);
router.use("/cert", certRoutes);

router.use("/lms", lmsRoutes);
router.use("/admin", adminRoutes);
router.use("/explorer", explorerRoutes);

export default router;
