import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting Migration: Moving to Hierarchical Structure...");

  try {
    const chaptersTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'chapters'
      );
    `;

    if ((chaptersTableExists as any)[0].exists) {
      console.log("renaming chapters table to modules...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "chapters" RENAME TO "modules";`
      );
    }
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "modules" RENAME COLUMN "order" TO "position";`
      );
    } catch (e) {
      console.log("Column 'order' might already be renamed or not exist.");
    }
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "lessons" RENAME COLUMN "chapterId" TO "moduleId";`
      );
    } catch (e) {
      console.log("Column 'chapterId' might already be renamed.");
    }
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "lessons" RENAME COLUMN "order" TO "position";`
      );
    } catch (e) {
      console.log("Column 'order' might already be renamed.");
    }
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "assignments" RENAME COLUMN "chapterId" TO "moduleId";`
      );
    } catch (e) {
      console.log("Column 'chapterId' might already be renamed.");
    }

    console.log(
      "Migration logic prepared. Please run `prisma db push` first to update schema structure, then run this script again to fix data relations if needed."
    );

    const examsToFix =
      await prisma.$queryRaw`SELECT * FROM "exams" WHERE "moduleId" IS NULL`;

    if (Array.isArray(examsToFix) && examsToFix.length > 0) {
      console.log(`Found ${examsToFix.length} exams to migrate...`);

      for (const exam of examsToFix) {
        const courseId = exam.courseId;

        const { v4: uuidv4 } = require("uuid");
        const newModuleId = uuidv4();

        // Create Module Raw
        await prisma.$executeRaw`
                INSERT INTO "modules" ("id", "title", "position", "isPublished", "courseId")
                VALUES (${newModuleId}, 'Final Exam', 999, true, ${courseId})
             `;

        // Update Exam
        await prisma.$executeRaw`
                UPDATE "exams" SET "moduleId" = ${newModuleId} WHERE "id" = ${exam.id}
             `;

        console.log(`Migrated Exam ${exam.id} to new Module ${newModuleId}`);
      }
    }

    console.log("Migration Complete.");
  } catch (error) {
    console.error("Migration Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
