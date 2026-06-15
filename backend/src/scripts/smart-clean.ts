import "dotenv/config";
import prisma from "../utils/prisma";

const rawUrl = process.env.DATABASE_URL;

if (rawUrl) {
  // Fix: Remove potential double quotes from shell env exports
  process.env.DATABASE_URL = rawUrl.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
}

console.log(
  `🔌 Database URL loaded: ${process.env.DATABASE_URL?.substring(0, 15)}...`
);

async function cleanTransactionalData() {
  console.log("🐘 Connecting to Database via Prisma...");

  try {
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
