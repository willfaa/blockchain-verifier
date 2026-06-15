import { db } from "./src/config/db";

async function main() {
  console.log("Starting manual migration...");
  try {
    // Users table
    await db.$executeRawUnsafe(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty TEXT;`
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS majority TEXT;`
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS "studyProgram" TEXT;`
    );

    // Assignments table
    await db.$executeRawUnsafe(
      `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS duration INTEGER;`
    );

    // AssignmentSubmissions table
    await db.$executeRawUnsafe(
      `ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP;`
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP;`
    );

    console.log("✅ Manual migration completed successfully.");
  } catch (err: any) {
    console.error("❌ Manual migration failed:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
