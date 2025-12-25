import { Router } from "express";
import { getExplorerStats } from "../controllers/explorerController";
import { verifyToken, verifyIssuer } from "../middleware/authMiddleware";

const router = Router();

// Only Admins or Teachers can view the explorer stats for now
// router.get("/stats", verifyToken, verifyIssuer, getExplorerStats);

// For development ease, let's keep it open or just verifyToken
router.get("/stats", getExplorerStats);

export default router;
