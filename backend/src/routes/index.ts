// backend/src/routes/index.ts
import { Router } from "express";

// Import Pecahan Routes
import certRoutes from "./certRoutes";
import lmsRoutes from "./lmsRoutes";
import cbtRoutes from "./cbtRoutes";
import authRoutes from "./authRoutes"; // Asumsi Anda punya authRoutes (login/register)
import adminRoutes from "./adminRoutes";
import examRoutes from "./examRoutes";
import explorerRoutes from "./explorerRoutes";

const router = Router();

// Gabungkan disini dengan prefix yang rapi
router.use("/auth", authRoutes); // Login jadi: /api/auth/login
router.use("/cert", certRoutes); // Legacy support
router.use("/certificates", certRoutes); // Issue jadi: /api/certificates/issue (Fix 404)
router.use("/lms", lmsRoutes); // Course jadi: /api/lms/course
router.use("/lms/exams", examRoutes); // Exam jadi: /api/lms/exams/:id/take
router.use("/cbt", cbtRoutes); // Ujian jadi: /api/cbt/exams
router.use("/admin", adminRoutes); // Admin jadi: /api/admin
router.use("/explorer", explorerRoutes); // Explorer jadi: /api/explorer

export default router;
