import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import fs from "fs";

// --- ROUTES IMPORTS ---
import { testConnection } from "./config/db";
import mainRouter from "./routes/index";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import lmsRoutes from "./routes/lmsRoutes"; // <--- TAMBAHKAN IMPORT INI

const app = express();
const PORT = process.env.PORT || 4000;

// --- GLOBAL MIDDLEWARES ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- STATIC FILE SERVING ---
const uploadsPath = path.join(process.cwd(), "uploads");
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir(uploadsPath);
ensureDir(path.join(uploadsPath, "avatars"));
ensureDir(path.join(uploadsPath, "courses"));
ensureDir(path.join(uploadsPath, "assignments"));
app.use("/uploads", express.static(uploadsPath));

// --- ROUTE MOUNTING (STRICT PRIORITY) ---

// 1. ADMIN ROUTES
app.use("/api/admin", adminRoutes);

// 2. USER ROUTES
app.use("/api/users", userRoutes);

// 3. LMS ROUTES (PENTING: Tambahkan ini agar /api/lms/... bisa diakses)
app.use("/api/lms", lmsRoutes);

// 4. GENERIC API ROUTES (Fallback untuk auth, dll)
app.use("/api", mainRouter);

// --- HEALTH CHECK ---
app.get("/", (_req, res) => {
  res.json({ ok: true, status: "LMS Backend Alive" });
});

// --- 404 HANDLER ---
app.use((req, res) => {
  console.warn(`[404] Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Endpoint not found" });
});

// --- STARTUP ---
testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
      🚀 Server running on: http://localhost:${PORT}
      👑 Admin API: http://localhost:${PORT}/api/admin
      📚 LMS API:   http://localhost:${PORT}/api/lms
      `);
    });
  })
  .catch((err) => {
    console.error("Critical Registry Failure:", err);
  });
