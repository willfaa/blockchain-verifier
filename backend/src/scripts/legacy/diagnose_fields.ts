import { db } from "./src/config/db";

async function diagnose() {
  console.log("Checking User model for 'faculty' field...");
  try {
    // @ts-ignore
    const fields = Object.keys((db as any).user.fields || {});
    console.log("Available User fields:", fields);

    if (fields.includes("faculty")) {
      console.log("✅ 'faculty' field is present in Prisma Client.");
    } else {
      console.log("❌ 'faculty' field is MISSING in Prisma Client.");
    }

    console.log("Checking AssignmentSubmission model for 'startedAt' field...");
    // @ts-ignore
    const subFields = Object.keys(
      (db as any).assignmentSubmission.fields || {}
    );
    console.log("Available AssignmentSubmission fields:", subFields);

    if (subFields.includes("startedAt")) {
      console.log("✅ 'startedAt' field is present in Prisma Client.");
    } else {
      console.log("❌ 'startedAt' field is MISSING in Prisma Client.");
    }
  } catch (err: any) {
    console.error("Diagnosis failed:", err.message);
  } finally {
    process.exit(0);
  }
}

diagnose();
