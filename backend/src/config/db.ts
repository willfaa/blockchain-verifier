import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Create a Postgres Pool with the connection string from env
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

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

    // Embedded Auto-Migration (Hardening)
    // This ensures missing columns exist regardless of Prisma sync state
    const hardeningQueries = [
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
  } catch (error: any) {
    console.error("❌ Database Connection Failed:", error.message);
    // Log helpful recovery tips
    if (error.message.includes("timed out")) {
      console.error(
        "TIP: Ensure the PostgreSQL service is running on port 5433.",
      );
    }
    process.exit(1);
  }
};
