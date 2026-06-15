import { Router } from "express";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getAssignment, // Added
} from "../controllers/assignmentController";
import {
  verifyToken as authenticate,
  authorize,
} from "../middleware/authMiddleware";

const router = Router();

// Teacher/Admin Management
router.post(
  "/",
  authenticate,
  authorize(["teacher", "admin"]),
  createAssignment
);
router.put(
  "/:id",
  authenticate,
  authorize(["teacher", "admin"]),
  updateAssignment
);
router.delete(
  "/:id",
  authenticate,
  authorize(["teacher", "admin"]),
  deleteAssignment
);

// Submissions (Student)
router.post("/submit", authenticate, submitAssignment);

// Grading (Teacher)
router.get(
  "/:assignmentId/submissions",
  authenticate,
  authorize(["teacher", "admin"]),
  getAssignmentSubmissions
);
router.put(
  "/submissions/:id",
  authenticate,
  authorize(["teacher", "admin"]),
  gradeSubmission
);

export default router;
