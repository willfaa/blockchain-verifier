import { db } from "./src/config/db";

async function diagnose() {
  console.log("--- DATABASE DIAGNOSIS ---");
  try {
    const userCols: any[] = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name;
    `;
    console.log("Users Table Columns:");
    userCols.forEach((c) =>
      console.log(` - ${c.column_name} (${c.data_type})`)
    );

    const subCols: any[] = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'assignment_submissions'
      ORDER BY column_name;
    `;
    console.log("\nAssignmentSubmissions Table Columns:");
    subCols.forEach((c) => console.log(` - ${c.column_name} (${c.data_type})`));

    const assignmentCols: any[] = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'assignments'
      ORDER BY column_name;
    `;
    console.log("\nAssignments Table Columns:");
    assignmentCols.forEach((c) =>
      console.log(` - ${c.column_name} (${c.data_type})`)
    );
  } catch (err: any) {
    console.error("Diagnosis failed:", err.message);
  } finally {
    process.exit(0);
  }
}

diagnose();
