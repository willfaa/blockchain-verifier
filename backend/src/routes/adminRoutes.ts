import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import {
  verifyTeacher,
  unverifyUser,
  banUser,
  unbanUser,
  deleteUser,
  getDashboardStats,
} from "../controllers/adminController";

const router = express.Router();

// Base Path: /api/admin
// All routes require Login + Admin Role

router.use(verifyToken);
router.use(verifyAdmin);

router.put("/users/:userId/verify", verifyTeacher);
router.put("/users/:userId/unverify", unverifyUser);
router.put("/users/:userId/ban", banUser);
router.put("/users/:userId/unban", unbanUser);
router.delete("/users/:userId", deleteUser); // New Route
router.get("/stats", getDashboardStats);

export default router;
