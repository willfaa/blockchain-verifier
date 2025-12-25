import { Router } from "express";
import * as ExamController from "../controllers/examController";
import { verifyToken, verifyIssuer } from "../middleware/authMiddleware";
import { uploadExcel } from "../middleware/uploadMiddleware";

const router = Router();

console.log(" [ROUTE] Loading Exam Routes...");

// Student Routes
// Path: /api/lms/exams/:id/take
router.get(
  "/:id/take",
  verifyToken,
  (req, res, next) => {
    console.log(`[ROUTE HIT] GET /exams/${req.params.id}/take`);
    next();
  },
  ExamController.getExamForAttempt
);

router.post("/:id/submit", verifyToken, ExamController.submitExamAttempt);

// Teacher / Admin Routes
router.get(
  "/:examId/submissions",
  verifyToken,
  verifyIssuer,
  ExamController.getExamSubmissions
);
router.delete(
  "/submissions/:id",
  verifyToken,
  verifyIssuer,
  ExamController.deleteSubmission
);

// Gradebook Route
// GET /api/lms/exams/course/:courseId/results
router.get(
  "/course/:courseId/results",
  verifyToken,
  verifyIssuer,
  ExamController.getCourseExamResults
);

// --- EXCEL HELPERS ---

// GET Template
router.get("/template", ExamController.downloadQuestionTemplate);

// Import Questions (Params: :id is examId)
router.post(
  "/:id/questions/import",
  verifyToken,
  verifyIssuer,
  uploadExcel.single("file"),
  ExamController.importQuestions
);

// Export Grades
router.get(
  "/:id/export",
  verifyToken,
  verifyIssuer,
  ExamController.exportExamGrades
);

// Get Specific Result Detail
router.get(
  "/results/:id",
  verifyToken,
  verifyIssuer,
  ExamController.getExamResultDetail
);

export default router;
