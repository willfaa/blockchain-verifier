// backend/src/routes/lmsRoutes.ts
import { Router } from "express";
import { upload } from "../middleware/uploadMiddleware";
import * as LMS from "../controllers/lmsController"; // Pastikan path benar
import {
  verifyToken,
  verifyIssuer,
  verifyIssuerType,
} from "../middleware/authMiddleware";
import * as ExamController from "../controllers/examController";
import * as QuestionController from "../controllers/questionController";

const router = Router();

// Public Routes

// Question Bank
// ...
router.delete("/questions/:id", verifyToken, QuestionController.deleteQuestion);

// Student Exam Routes MOVED TO examRoutes.ts
// router.get("/exams/:id/take", ...);

// Debug Route
router.get("/courses", LMS.getCourses);

// --- LESSON MANAGEMENT ---
// Note: Some lesson implementation uses courseId in params, but logic is inside controller usually by lessonId
// But for consistency with frontend structure:

// --- EXAM & QUESTION BANK ROUTES ---
router.get(
  "/courses/:courseId/exam",
  verifyToken,
  ExamController.getCourseExam
);
router.post(
  "/courses/:courseId/exam",
  verifyToken,
  verifyIssuerType("teacher"),
  ExamController.upsertExam
);

// Question Bank
router.post(
  "/courses/:courseId/exam/questions",
  verifyToken,
  // verifyIssuerType("teacher"), // Optional: Strict check
  QuestionController.addQuestionToCourseExam
);

router.post(
  "/courses/:courseId/exam/questions/bulk",
  verifyToken,
  QuestionController.bulkAddQuestions
);

router.patch(
  "/questions/:id/toggle",
  verifyToken,
  QuestionController.toggleQuestionStatus
);

router.delete("/questions/:id", verifyToken, QuestionController.deleteQuestion);

// Moved to top (Definitions are at line 17)
// Removed duplicate entries here.

// Debug Route
router.get("/ping", (req, res) =>
  res.json({ msg: "LMS PONG", time: new Date() })
);

router.get("/courses/:courseId/outline", LMS.getCourseOutline);
router.get("/courses/:id", LMS.getPublicCourse);
router.get(
  "/teacher/courses/:id",
  verifyToken,
  verifyIssuer,
  LMS.getTeacherCourse
);
router.get(
  "/teacher/my-courses",
  verifyToken,
  verifyIssuer,
  LMS.getTeacherCourses
);
router.get("/lessons/:id", verifyToken, LMS.getLesson);
router.get("/courses/:id/students", verifyToken, LMS.getCourseStudents);
router.get("/students/:nim", verifyToken, verifyIssuer, LMS.getStudentByNim);
router.put(
  "/enrollments/status",
  verifyToken,
  verifyIssuer,
  verifyIssuer,
  LMS.updateEnrollmentStatus
);
router.delete(
  "/courses/:courseId/students/:studentId",
  verifyToken,
  verifyIssuer,
  LMS.kickStudent
);

// Protected Routes
router.post("/enroll", verifyToken, LMS.enrollStudent);
router.post(
  "/courses",
  verifyToken,
  verifyIssuer,
  upload.single("thumbnail"),
  LMS.createCourse
);
router.put(
  "/courses/:id",
  verifyToken,
  verifyIssuer,
  upload.single("thumbnail"),
  LMS.updateCourse
);
router.delete("/courses/:id", verifyToken, verifyIssuer, LMS.deleteCourse);
router.post(
  "/lessons",
  verifyToken,
  verifyIssuer,
  upload.single("video"),
  LMS.addLesson
);
router.put(
  "/lessons/:id",
  verifyToken,
  verifyIssuer,
  upload.single("video"),
  LMS.updateLesson
);

// Chapter Routes
import * as Chapter from "../controllers/chapterController";
router.post("/chapters", verifyToken, verifyIssuer, Chapter.createChapter);
router.delete(
  "/chapters/:id",
  verifyToken,
  verifyIssuer,
  Chapter.deleteChapter
);

// End of Question Bank Routes

export default router;
