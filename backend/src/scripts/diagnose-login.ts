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
    console.log("2. Attempting to rename 'nim' to 'nisn' in users table...");
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "users" RENAME COLUMN "nim" TO "nisn";',
      );
      console.log("   ✅ User table: Renamed 'nim' to 'nisn'.");
    } catch (e: any) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log(
          "   ⚠️ User table: 'nim' column not found (maybe already renamed or 'nisn' exists).",
        );
      } else {
        console.error("   ❌ User table rename failed:", e.message);
      }
    }

    console.log(
      "3. Attempting to rename 'nim' to 'nisn' in certificates table...",
    );
    try {
      await db.$executeRawUnsafe(
        'ALTER TABLE "certificates" RENAME COLUMN "nim" TO "nisn";',
      );
      console.log("   ✅ Certificate table: Renamed 'nim' to 'nisn'.");
    } catch (e: any) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log(
          "   ⚠️ Certificate table: 'nim' column not found (maybe already renamed).",
        );
      } else {
        console.error("   ❌ Certificate table rename failed:", e.message);
      }
    }

    // 4. Verifying 'nisn' column...
    console.log("4. Verifying 'nisn' column...");
    try {
      const user = await db.user.findFirst({
        where: { nisn: "CHECK_EXISTENCE" },
      });
      console.log("   ✅ NISN query success (Schema matches DB).");
    } catch (e: any) {
      console.error("   ❌ NISN query still failing:", e.message);
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
