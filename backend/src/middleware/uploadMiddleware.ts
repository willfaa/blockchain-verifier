// backend/src/middleware/uploadMiddleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    let folder = "others";

    // Determine folder based on field name
    if (file.fieldname === "avatar") {
      folder = "avatars";
    } else if (
      file.fieldname === "thumbnail" ||
      file.fieldname === "image" ||
      file.fieldname === "video" ||
      file.fieldname === "assignment_file"
    ) {
      folder = file.fieldname === "assignment_file" ? "assignments" : "courses";
    }

    // 1. Get User ID from Request (Auth Middleware must run first!)
    const userId = req.user?.id || req.user?.userId || "anonymous";

    // 2. Define User-Specific Path: /uploads/{type}/{userId}/
    const uploadPath = path.join(process.cwd(), "uploads", folder, userId);

    console.log("Multer Destination Logic Triggered");
    console.log("Saving to:", uploadPath);

    // Ensure directory exists (Recursive)
    if (!fs.existsSync(uploadPath)) {
      console.log("Directory does not exist. Creating...", uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 3. Unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Sanitize filename
    const sanitizedFieldname = file.fieldname.replace(/[^a-z0-9]/gi, "_");
    cb(null, `${sanitizedFieldname}-${uniqueSuffix}${ext}`);
  },
});

// Filter file (Hanya boleh Video & Gambar)
const fileFilter = (req: any, file: any, cb: any) => {
  console.log(
    "Multer Filter Checking:",
    file.originalname,
    file.mimetype,
    file.fieldname
  );
  if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) {
    console.error("Multer Rejected: Video mime mismatch");
    return cb(new Error("Only video files are allowed!"), false);
  }
  if (file.fieldname === "thumbnail" && !file.mimetype.startsWith("image/")) {
    console.error("Multer Rejected: Thumbnail mime mismatch");
    return cb(new Error("Only image files are allowed!"), false);
  }
  // Allow avatar (no strict check here aside from default match or if we added one)
  cb(null, true);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // Limit 500MB per file
});

// Excel Upload (Memory Storage)
const memoryStorage = multer.memoryStorage();
const excelFilter = (req: any, file: any, cb: any) => {
  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed!"), false);
  }
};

export const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: excelFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});
