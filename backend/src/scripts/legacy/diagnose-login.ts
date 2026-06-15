import { db } from "../config/db";

async function main() {
  console.log("Diagnosing DB Connection...");
  try {
    // 1. Basic Connection
    console.log("1. Fetching any user...");
    const users = await db.user.findMany({ take: 1 });
    console.log("   Success. Found users:", users.length);
    if (users.length > 0) {
      console.log("   Sample User keys:", Object.keys(users[0]));
    }

    // 2. Attempt Column Rename (Manual Migration)
    console.log("2. Attempting to rename 'nisn' to 'studentId' in users table...");
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "users" RENAME COLUMN "nisn" TO "studentId";',
      );
      console.log("   ✅ User table: Renamed 'nisn' to 'studentId'.");
    } catch (e: any) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log(
          "   ⚠️ User table: 'nisn' column not found (maybe already renamed or 'studentId' exists).",
        );
      } else {
        console.error("   ❌ User table rename failed:", e.message);
      }
    }

    console.log(
      "3. Attempting to rename 'nisn' to 'studentId' in certificates table...",
    );
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "certificates" RENAME COLUMN "nisn" TO "studentId";',
      );
      console.log("   ✅ Certificate table: Renamed 'nisn' to 'studentId'.");
    } catch (e: any) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log(
          "   ⚠️ Certificate table: 'nisn' column not found (maybe already renamed).",
        );
      } else {
        console.error("   ❌ Certificate table rename failed:", e.message);
      }
    }

    // 4. Verifying 'studentId' column...
    console.log("4. Verifying 'studentId' column...");
    try {
      const user = await db.user.findFirst({
        where: { studentId: "CHECK_EXISTENCE" },
      });
      console.log("   ✅ StudentId query success (Schema matches DB).");
    } catch (e: any) {
      console.error("   ❌ StudentId query still failing:", e.message);
    }
  } catch (e: any) {
    console.error("!!! DB DIAGNOSIS FAILED !!!");
    console.error("Error Code:", e.code);
    console.error("Error Message:", e.message);
    if (e.meta) console.error("Meta:", e.meta);
  } finally {
    process.exit(0);
  }
}

main();
