import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Create a Postgres Pool with the connection string from env
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_URL.startsWith("postgresql://") || process.env.SUPABASE_URL.startsWith("postgres://"))) {
    return process.env.SUPABASE_URL;
  }
  if (process.env.POSTGRES_HOST) {
    const user = process.env.POSTGRES_USER || "postgres";
    const password = process.env.POSTGRES_PASSWORD || "";
    const host = process.env.POSTGRES_HOST;
    const port = process.env.POSTGRES_PORT || "5432";
    const dbName = process.env.POSTGRES_DATABASE || "postgres";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?sslmode=require`;
  }
  return "postgresql://postgres:willfaa@127.0.0.1:5433/chainnesa_db?schema=public&connect_timeout=60";
};

const connectionString = getDatabaseUrl();
const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1") || connectionString.includes("5433");
const pool = new Pool({ 
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// 2. Create the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Global Singleton for consistency across hot-reloads
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["error", "warn"], // Reduced noise
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const prisma = db;
export default db;

/**
 * Validates the database connection at startup.
 * Uses a lightweight query to ensure the pool and adapter are functional.
 */
export const testConnection = async () => {
  try {
    console.log("⏳ Connecting to PostgreSQL & Hardening Schema...");
    // Lightweight ping
    await db.$queryRaw`SELECT 1`;

    if (!process.env.VERCEL) {
      // Embedded Auto-Migration (Hardening)
      // This ensures missing columns exist regardless of Prisma sync state
      const hardeningQueries = [
        "CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS majority TEXT;",
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS "studyProgram" TEXT;',
        "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS duration INTEGER;",
        'ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP;',
        'ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP;',
      ];

      for (const sql of hardeningQueries) {
        await db.$executeRawUnsafe(sql);
      }
      console.log("✅ PostgreSQL Connected & Schema Hardened Successfully");
    } else {
      console.log("✅ PostgreSQL Connected (Hardening skipped on Vercel)");
    }
  } catch (error: any) {
    console.error("❌ Database Connection Failed:", error.message);
    // Log helpful recovery tips
    if (error.message.includes("timed out")) {
      console.error(
        "TIP: Ensure the PostgreSQL service is running on port 5433.",
      );
    }
    if (process.env.VERCEL) {
      throw error;
    } else {
      process.exit(1);
    }
  }
};
