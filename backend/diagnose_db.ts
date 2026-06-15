import { db } from "./src/config/db";

async function diagnose() {
  console.log("Checking User table columns...");
  try {
    const userColumns: any[] = await db.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;
    console.log(
      "Users table columns:",
      userColumns.map((c) => c.column_name)
    );

    const submissionColumns: any[] = await db.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assignment_submissions'
    `;
    console.log(
      "AssignmentSubmissions table columns:",
      submissionColumns.map((c) => c.column_name)
    );
  } catch (err: any) {
    console.error("Diagnosis failed:", err.message);
  } finally {
    process.exit(0);
  }
}

diagnose();
