import { Router } from "express";
import * as lmsController from "../controllers/lmsController";
import { CertificateController } from "../controllers/certificateController";
import {
  verifyToken,
  verifyTeacher,
  optionalVerifyToken,
} from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();
const certController = new CertificateController();

/**
 * LMS API Manifest
 * Base Path: /api/lms
 */

// --- STUDENT / PUBLIC ROUTES ---
router.get("/courses", lmsController.getCourses);
router.get(
  "/courses/:courseId",
  optionalVerifyToken,
  lmsController.getCourseById
);
router.post("/enroll", verifyToken, lmsController.enrollCourse);

// Certificates (Student)
router.get("/certificates", verifyToken, (req, res) =>
  certController.getMyCertificates(req, res)
);
router.post("/certificates/claim", verifyToken, (req, res) =>
  certController.claimCertificate(req, res)
);
router.get("/certificates/:id", (req, res) =>
  certController.getCertificate(req, res)
);

// --- TEACHER ROUTES (Protected) ---

// Dashboard & Stats
router.get(
  "/teacher/my-courses",
  verifyToken,
  verifyTeacher,
  lmsController.getTeacherCourses
);

// Course Management
router.post(
  "/courses",
  verifyToken,
  verifyTeacher,
  upload.single("thumbnail"),
  lmsController.createCourse
);

router.put(
  "/courses/:courseId",
  verifyToken,
  verifyTeacher,
  upload.single("thumbnail"),
  lmsController.updateCourse
);

router.delete(
  "/courses/:courseId",
  verifyToken,
  verifyTeacher,
  lmsController.deleteCourse
);

router.post(
  "/courses/:courseId/exam",
  verifyToken,
  verifyTeacher,
  lmsController.upsertExam
);

router.post(
  "/courses/:courseId/exam/questions",
  verifyToken,
  verifyTeacher,
  lmsController.addExamQuestion
);

router.delete(
  "/questions/:questionId",
  verifyToken,
  verifyTeacher,
  lmsController.deleteExamQuestion
);

router.post(
  "/exams/:examId/submit",
  verifyToken,
  lmsController.submitExamAttempt
);

// Course Sub-Features (Fixing 404s)
router.get(
  "/courses/:courseId/students",
  verifyToken,
  verifyTeacher,
  lmsController.getCourseStudents
);
router.delete(
  "/courses/:courseId/students/:userId",
  verifyToken,
  verifyTeacher,
  lmsController.removeStudent
);

router.get(
  "/courses/:courseId/exam",
  verifyToken,
  verifyTeacher,
  lmsController.getCourseExam
);

router.get(
  "/courses/:courseId/assignments",
  verifyToken,
  verifyTeacher,
  lmsController.getCourseAssignments
);

router.get(
  "/courses/:courseId/results",
  verifyToken,
  verifyTeacher,
  lmsController.getExamResults
);

// Alias for Results (Frontend Alignment)
router.get(
  "/exams/course/:courseId/results",
  verifyToken,
  verifyTeacher,
  lmsController.getExamResults
);

// Exam Management (Advanced)
router.get(
  "/exams/results/:id",
  verifyToken,
  verifyTeacher,
  lmsController.getExamResultDetail
);

router.delete(
  "/exams/submissions/:id",
  verifyToken,
  verifyTeacher,
  lmsController.deleteSubmission
);

router.get(
  "/exams/template",
  verifyToken,
  verifyTeacher,
  lmsController.downloadQuestionTemplate
);

router.post(
  "/exams/:examId/questions/import",
  verifyToken,
  verifyTeacher,
  upload.single("file"),
  lmsController.importQuestions
);

router.get(
  "/exams/:examId/export",
  verifyToken,
  verifyTeacher,
  lmsController.exportExamGrades
);

// Module Management
router.post(
  "/courses/:courseId/modules",
  verifyToken,
  verifyTeacher,
  lmsController.createModule
);

router.put(
  "/modules/:id",
  verifyToken,
  verifyTeacher,
  lmsController.updateModule
);

router.delete(
  "/modules/:id",
  verifyToken,
  verifyTeacher,
  lmsController.deleteModule
);

// Lesson Management
router.get(
  "/lessons/:id",
  verifyToken,
  verifyTeacher,
  lmsController.getLessonById
);

router.post(
  "/modules/:moduleId/lessons",
  verifyToken,
  verifyTeacher,
  lmsController.createLesson
);

router.put(
  "/lessons/:id",
  verifyToken,
  verifyTeacher,
  lmsController.updateLesson
);

router.delete(
  "/lessons/:id",
  verifyToken,
  verifyTeacher,
  lmsController.deleteLesson
);

// --- ASSIGNMENT MANAGEMENT ---

router.post(
  "/assignments",
  verifyToken,
  verifyTeacher,
  lmsController.createAssignment
);

router.put(
  "/assignments/:id",
  verifyToken,
  verifyTeacher,
  lmsController.updateAssignment
);

router.delete(
  "/assignments/:id",
  verifyToken,
  verifyTeacher,
  lmsController.deleteAssignment
);

router.get("/assignments/:id", verifyToken, lmsController.getAssignment);
router.post(
  "/assignments/:id/start",
  verifyToken,
  lmsController.startAssignment
);

router.post(
  "/assignments/submit",
  verifyToken,
  upload.single("assignment_file"),
  lmsController.submitAssignment
);

router.post(
  "/assignments/upload-artifact",
  verifyToken,
  upload.single("assignment_file"),
  lmsController.uploadAssignmentArtifact
);

router.patch(
  "/assignments/submissions/:id",
  verifyToken,
  upload.single("assignment_file"),
  lmsController.updateAssignmentSubmission
);

router.delete(
  "/assignments/submissions/:id",
  verifyToken,
  lmsController.deleteAssignmentSubmission
);

router.delete(
  "/teacher/assignments/submissions/:id",
  verifyToken,
  verifyTeacher,
  lmsController.teacherDeleteSubmission
);

router.get(
  "/assignments/:assignmentId/submissions",
  verifyToken,
  verifyTeacher,
  lmsController.getAssignmentSubmissions
);

router.put(
  "/assignments/submissions/:id",
  verifyToken,
  verifyTeacher,
  lmsController.gradeSubmission
);

export default router;
