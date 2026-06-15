const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- DB COLUMN DIAGNOSIS ---");
  try {
    // Query metadata to find columns in 'users' table
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;

    console.log("Columns in 'users' table:");
    const columns = result.map((r) => r.column_name);
    console.log(columns);

    if (columns.includes("nim")) {
      console.log("DETECTED: 'nim' column exists. Needs rename.");
    }
    if (columns.includes("nisn")) {
      console.log("DETECTED: 'nisn' column exists. Schema seems correct?");
    }
  } catch (e) {
    console.error("Diagnosis Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
