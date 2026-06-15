const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB Fix (JS)...");
  try {
    // 2. Attempt Column Rename (Manual Migration)
    console.log("2. Attempting to rename 'nim' to 'nisn' in users table...");
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "users" RENAME COLUMN "nim" TO "nisn";',
      );
      console.log("   ✅ User table: Renamed 'nim' to 'nisn'.");
    } catch (e) {
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
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "certificates" RENAME COLUMN "nim" TO "nisn";',
      );
      console.log("   ✅ Certificate table: Renamed 'nim' to 'nisn'.");
    } catch (e) {
      if (e.message.includes("does not exist") || e.message.includes("42703")) {
        console.log(
          "   ⚠️ Certificate table: 'nim' column not found (maybe already renamed).",
        );
      } else {
        console.error("   ❌ Certificate table rename failed:", e.message);
      }
    }
  } catch (e) {
    console.error("!!! DB DIAGNOSIS FAILED !!!", e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
