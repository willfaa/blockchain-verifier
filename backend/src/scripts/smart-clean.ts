import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const rawUrl = process.env.DATABASE_URL;

if (rawUrl) {
  // Fix: Remove potential double quotes from shell env exports
  process.env.DATABASE_URL = rawUrl.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
}

console.log(
  `🔌 Database URL loaded: ${process.env.DATABASE_URL?.substring(0, 15)}...`
);

const prisma = new PrismaClient();

async function cleanTransactionalData() {
  console.log("🐘 Connecting to Database via Prisma...");

  try {
    // Truncate Transactional Tables (Cascade to children)
    // Tables: courses, certificates, enrollments, exam_results
    // We do NOT truncate 'users'

    // Note: We use RAW SQL for Truncate to ensure CASCADE works efficiently
    // Prisma deleteMany doesn't reset IDs/sequences easily.

    console.log("🗑️  Truncating Transactional Tables...");

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE  certificates, enrollments, exam_results CASCADE;
    `);

    console.log("✅ Transactional data wiped successfully.");
    console.log("🛡️  User accounts (Admin/Teacher/Student) are SAFE.");
  } catch (error) {
    console.error("❌ Failed to clean database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTransactionalData();
