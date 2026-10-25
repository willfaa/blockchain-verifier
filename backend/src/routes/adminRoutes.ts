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
  getAdminCourses,
  getAdminCourseById,
  updateAdminCourse,
  deleteAdminCourse,
  getCertificateDetails,
  updateCertificateDetails,
  updateCertificateTemplateBackground,
  deleteCertificateTemplateBackground,
  updateTranscriptTemplateBackground,
  deleteTranscriptTemplateBackground,
  updateInstitutionLogo,
  deleteInstitutionLogo,
  getCertificateTemplatePreview,
  getCertificateLayoutConfig,
  updateCertificateLayoutConfig,
  resetCertificateLayoutConfig,
  getTranscriptLayoutConfig,
  updateTranscriptLayoutConfig,
  resetTranscriptLayoutConfig,
  getBidangList,
  createBidang,
  updateBidang,
  deleteBidang,
  getProgramList,
  createProgram,
  updateProgram,
  deleteProgram,
  getKonsentrasiList,
  createKonsentrasi,
  updateKonsentrasi,
  deleteKonsentrasi,
  getMasterCompetencyUnits,
  createMasterCompetencyUnit,
  updateMasterCompetencyUnit,
  deleteMasterCompetencyUnit,
} from "../controllers/adminController";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { CertController } from "../controllers/certController";
import { downloadUserTemplate } from "../controllers/bulkController";

const router = Router();

const certController = new CertController();

// Base Path: /api/admin
router.use(verifyToken);

/**
 * PUBLIC / ISSUER READ-ONLY ENDPOINTS (Teachers & Admins)
 * Accessible by authenticated teachers to populate UKK exam schemes, competency units, and certificate presets
 */
router.get("/departments/bidang", getBidangList);
router.get("/departments/program", getProgramList);
router.get("/departments/konsentrasi", getKonsentrasiList);
router.get("/departments/units", getMasterCompetencyUnits);
router.get("/settings/details", getCertificateDetails);
router.get("/settings/template-preview", getCertificateTemplatePreview);
router.get("/settings/layout-config", getCertificateLayoutConfig);
router.get("/settings/transcript-layout-config", getTranscriptLayoutConfig);

// All subsequent routes strictly require Administrator privileges:
router.use(verifyAdmin);

/**
 * DASHBOARD STATS
 * Endpoint: GET /api/admin/stats
 */
router.get("/stats", getDashboardStats);

/**
 * TRANSACTION LOGS / CERTIFICATES
 * Endpoint: GET /api/admin/certificates
 */
router.get("/certificates", (req, res) => certController.getAllCertificates(req, res));

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
 * GET /api/admin/users/template
 */
router.get("/users/pending", getPendingUsers);
router.get("/users/active", getActiveUsers);
router.get("/users/template", downloadUserTemplate);

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



/**
 * COURSE MANAGEMENT (ADMIN FULL ACCESS)
 */
router.get("/courses", getAdminCourses);
router.get("/courses/:id", getAdminCourseById);
router.put(
  "/courses/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "certificateTemplate", maxCount: 1 },
  ]),
  updateAdminCourse
);
router.delete("/courses/:id", deleteAdminCourse);

/**
 * CERTIFICATE TEMPLATE & DETAILS SETTINGS
 */
router.get("/settings/details", getCertificateDetails);
router.post("/settings/details", updateCertificateDetails);
router.post(
  "/settings/template",
  upload.fields([{ name: "certificateTemplate", maxCount: 1 }]),
  updateCertificateTemplateBackground
);
router.delete("/settings/template", deleteCertificateTemplateBackground);

// Transcript Template (Page 2) Background Endpoints
router.post(
  "/settings/transcript-template",
  upload.fields([{ name: "transcriptTemplate", maxCount: 1 }]),
  updateTranscriptTemplateBackground
);
router.delete("/settings/transcript-template", deleteTranscriptTemplateBackground);

// Institution / University / School Logo Endpoints
router.post(
  "/settings/logo",
  upload.fields([{ name: "institutionLogo", maxCount: 1 }, { name: "logo", maxCount: 1 }]),
  updateInstitutionLogo
);
router.delete("/settings/logo", deleteInstitutionLogo);

// Layout Config Mutations (Admin Only)
router.post("/settings/layout-config", updateCertificateLayoutConfig);
router.delete("/settings/layout-config", resetCertificateLayoutConfig);

// Page 2 Transcript Visual Layout Config Mutations (Admin Only)
router.post("/settings/transcript-layout-config", updateTranscriptLayoutConfig);
router.delete("/settings/transcript-layout-config", resetTranscriptLayoutConfig);

/**
 * EXPERTISE FIELDS CRUD MUTATIONS (BIDANG, PROGRAM, KONSENTRASI KEAHLIAN) - Admin Only
 */
// Bidang Mutations
router.post("/departments/bidang", createBidang);
router.put("/departments/bidang/:id", updateBidang);
router.delete("/departments/bidang/:id", deleteBidang);

// Program Mutations
router.post("/departments/program", createProgram);
router.put("/departments/program/:id", updateProgram);
router.delete("/departments/program/:id", deleteProgram);

// Konsentrasi Mutations
router.post("/departments/konsentrasi", createKonsentrasi);
router.put("/departments/konsentrasi/:id", updateKonsentrasi);
router.delete("/departments/konsentrasi/:id", deleteKonsentrasi);

// Master Competency Units Mutations (Level 4 - SKKNI / IDUKA Bank) - Admin Only
router.post("/departments/units", createMasterCompetencyUnit);
router.put("/departments/units/:id", updateMasterCompetencyUnit);
router.delete("/departments/units/:id", deleteMasterCompetencyUnit);

export default router;
