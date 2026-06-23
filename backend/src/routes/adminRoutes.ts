import { Router } from "express";
import {
  getDashboardStats,
  getPendingUsers,
  getActiveUsers,
  approveUser,
  getUserById,
  verifyTeacher,
  unverifyUser,
  banUser,
  unbanUser,
  deleteUser,
  bulkCreateUsers,
  getSystemSettings,
  updateSystemSettings,
} from "../controllers/adminController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";

const router = Router();

// Base Path: /api/admin
router.use(verifyToken);
router.use(verifyAdmin);

/**
 * DASHBOARD STATS
 * Endpoint: GET /api/admin/stats
 */
router.get("/stats", getDashboardStats);

/**
 * SYSTEM SETTINGS
 * Endpoints:
 * GET /api/admin/settings
 * POST /api/admin/settings
 */
router.get("/settings", getSystemSettings);
router.post("/settings", updateSystemSettings);

/**
 * USER MANAGEMENT
 * Endpoints:
 * GET /api/admin/users/pending
 * GET /api/admin/users/active
 */
router.get("/users/pending", getPendingUsers);
router.get("/users/active", getActiveUsers);

/**
 * USER ACTIONS
 */
router.get("/users/:userId", getUserById);
router.put("/users/:userId/approve", approveUser);
router.put("/users/:userId/verify", verifyTeacher);
router.put("/users/:userId/unverify", unverifyUser);
router.put("/users/:userId/ban", banUser);
router.put("/users/:userId/unban", unbanUser);
router.delete("/users/:userId", deleteUser);

/**
 * BULK OPERATIONS
 */
router.post("/users/bulk", bulkCreateUsers);

export default router;
