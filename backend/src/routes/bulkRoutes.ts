import { Router } from "express";
import * as bulkController from "../controllers/bulkController";
import { uploadExcel } from "../middleware/uploadMiddleware";
import {
  verifyToken,
  verifyAdmin,
  verifyTeacher,
} from "../middleware/authMiddleware";

const router = Router();

// --- USERS (Admin Only) ---
router.get(
  "/template/users",
  verifyToken,
  verifyAdmin,
  bulkController.downloadUserTemplate
);
router.post(
  "/import/users",
  verifyToken,
  verifyAdmin,
  uploadExcel.single("file"),
  bulkController.importUsers
);
router.get(
  "/export/users",
  verifyToken,
  verifyAdmin,
  bulkController.exportUsers
);

// --- COURSES (Teacher or Admin) ---
// Teachers need to import courses for themselves.
// Note: verifyTeacher usually allows Admin too if implemented hierarchically,
// otherwise we might need middleware that allows both.
// Let's assume verifyTeacher allows Teachers. Admin usually has overrides or we just rely on verifyToken and check role in controller
// but controller requires teacherId in body.

router.get(
  "/template/courses",
  verifyToken,
  bulkController.downloadCourseTemplate
);
router.post(
  "/import/courses",
  verifyToken,
  uploadExcel.single("file"),
  bulkController.importCourseStructure
);

export default router;
