// backend/src/routes/cbtRoutes.ts
import { Router } from "express";
import * as CBT from "../controllers/cbtController";
import { verifyToken, verifyIssuer } from "../middleware/authMiddleware";

const router = Router();

// Teacher: Bikin Soal
router.post("/exams", verifyToken, verifyIssuer, CBT.createExam);
router.post("/questions", verifyToken, verifyIssuer, CBT.addQuestion);

// Student: Mengerjakan Soal
router.get("/exams/:examId/start", verifyToken, CBT.getExamQuestions); // Ambil soal
router.post("/exams/submit", verifyToken, CBT.submitExam); // Kirim jawaban

export default router;
