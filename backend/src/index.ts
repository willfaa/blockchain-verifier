// backend/src/index.ts
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { testConnection } from "./config/db";
import mainRouter from "./routes/index";
import userRoutes from "./routes/userRoutes"; // New Route

// Env Variables
const PORT = process.env.PORT || 4000;
const FABRIC_ENABLED =
  String(process.env.FABRIC_ENABLED).toLowerCase() === "true";

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEBUG LOGGER: Prints every incoming request
app.use((req, res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.url}`);
  next();
});

// ------------------------------------------------------------
// FIX: STATIC FILE SERVING (ABSOLUTE PATH)
// ------------------------------------------------------------
import fs from "fs"; // Ensure fs is imported if not already

// 33. Get the absolute path to the 'uploads' folder
// Use path.resolve relative to THIS file (src/index.ts) -> backend/uploads
// This ensures consistency with the middleware.
// 33. Get the absolute path to the 'uploads' folder
// Use process.cwd() as requested for systemic fix
const uploadsPath = path.join(process.cwd(), "uploads");

// 2. Ensure directories exist (Auto-fix folder structure)
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir(uploadsPath);
ensureDir(path.join(uploadsPath, "avatars"));
ensureDir(path.join(uploadsPath, "courses"));

// 3. Debug Log (So we can see it in terminal)
console.log(`📂 Static Files served from: ${uploadsPath}`);

// 4. Mount it
// URL: http://localhost:4000/uploads/file.png  -->  Maps to: backend/uploads/file.png
app.use("/uploads", express.static(uploadsPath));
// ------------------------------------------------------------

// --- ROUTES ---
// Semua route (Auth, Cert, LMS, CBT) masuk lewat prefix /api
app.use("/api", mainRouter);

// CORRECT MOUNTING (Must match Frontend calls)
app.use("/api/users", userRoutes); // Matches [INCOMING] PUT /api/users/profile

// --- HEALTH CHECK ---
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "Blockchain Verifier + LMS Backend is Live 🚀",
    mode: FABRIC_ENABLED ? "Blockchain Active" : "Database Only",
  });
});

// --- START SERVER ---
// Cek koneksi DB dulu, baru nyalakan server
testConnection()
  .then(() => {
    console.log("✅ PostgreSQL Connected");
    app.listen(PORT, () => {
      console.log(`
      🚀 Server running on: http://localhost:${PORT}
      📂 Uploads accessible: http://localhost:${PORT}/uploads
      🔗 API Endpoint: http://localhost:${PORT}/api
      `);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
    // Opsional: Tetap jalankan server meski DB mati (kalau mau debug fitur lain)
    // process.exit(1);
  });
