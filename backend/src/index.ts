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

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4000",
  "https://blockchain-verifier-eight.vercel.app",
  "https://www.willfaa.web.id",
  "https://willfaa.web.id",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Support multiple custom domains via comma-separated env var
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",").forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed) allowedOrigins.push(trimmed);
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow all origins to seamlessly support Vercel deployments, custom domains, and tunnels
      callback(null, true);
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
      "bypass-tunnel-reminder",
      "Bypass-Tunnel-Reminder",
    ],
  }),
);

// --- GLOBAL MIDDLEWARES ---
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- STATIC FILE SERVING ---
const uploadsPath = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "uploads");

const ensureDir = (dir: string) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err: any) {
    console.warn(`[Warning] Failed to create directory ${dir}:`, err.message);
  }
};
ensureDir(uploadsPath);
ensureDir(path.join(uploadsPath, "avatars"));
ensureDir(path.join(uploadsPath, "courses"));
ensureDir(path.join(uploadsPath, "assignments"));
// Serve writable (dynamic) uploads
app.use("/uploads", express.static(uploadsPath));

// On Vercel, also serve bundled static uploads from the repository
if (process.env.VERCEL) {
  const bundledUploadsPath = path.join(process.cwd(), "backend", "uploads");
  app.use("/uploads", express.static(bundledUploadsPath));
}

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

      // Non-blocking background wallet sync on startup for production/local resilience
      if (process.env.FABRIC_ENABLED === "true") {
        import("./fabric/client")
          .then(({ autoSyncFabricWallet }) => autoSyncFabricWallet())
          .catch((e) => console.warn("[Startup Fabric AutoSync skipped]:", e.message));
      }
    });
  })
  .catch((err) => {
    console.error("Critical Registry Failure:", err);
  });

export default app;
