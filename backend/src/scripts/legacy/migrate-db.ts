import dotenv from "dotenv";
dotenv.config();

import { db } from "./src/config/db";

async function main() {
  console.log("Starting DB migration: Renaming 'nisn' to 'studentId'...");
  try {
    // 1. Rename column in 'users' table
    console.log("Renaming column 'nisn' to 'studentId' in 'users' table...");
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "users" RENAME COLUMN "nisn" TO "studentId";'
      );
      console.log("   ✅ 'users' table: Renamed 'nisn' to 'studentId'.");
    } catch (e: any) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log("   ⚠️ 'users' table: Column 'nisn' not found (may already be renamed).");
      } else {
        console.error("   ❌ 'users' table rename failed:", e.message);
      }
    }

    // 2. Rename unique constraint in 'users' table if exists
    console.log("Renaming constraint 'users_nisn_key' to 'users_studentId_key'...");
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "users" RENAME CONSTRAINT "users_nisn_key" TO "users_studentId_key";'
      );
      console.log("   ✅ 'users' table: Renamed constraint 'users_nisn_key' to 'users_studentId_key'.");
    } catch (e: any) {
      console.log("   ⚠️ Constraint 'users_nisn_key' rename skipped.");
    }

    // 3. Rename column in 'certificates' table
    console.log("Renaming column 'nisn' to 'studentId' in 'certificates' table...");
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "certificates" RENAME COLUMN "nisn" TO "studentId";'
      );
      console.log("   ✅ 'certificates' table: Renamed 'nisn' to 'studentId'.");
    } catch (e: any) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log("   ⚠️ 'certificates' table: Column 'nisn' not found (may already be renamed).");
      } else {
        console.error("   ❌ 'certificates' table rename failed:", e.message);
      }
    }

  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await db.$disconnect();
    console.log("DB migration completed.");
    process.exit(0);
  }
}

main();
