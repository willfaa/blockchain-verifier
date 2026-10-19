// backend/src/routes/authRoutes.ts
import { Router } from "express";
import * as Auth from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

// Endpoint: /api/auth/register
router.post("/register", Auth.register);

// Endpoint: /api/auth/login
router.post("/login", Auth.login);

// Endpoint: /api/auth/student/:studentId (Protected user lookup)
router.get("/student/:studentId", verifyToken, Auth.findStudentByStudentId);

// Endpoint: /api/auth/me (Get Current User Data)
router.get("/me", verifyToken, Auth.getMe);

export default router;
