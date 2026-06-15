import { db } from "./config/db";

async function diagnose() {
  const id = "8dea88d5-9d1c-4f58-8778-9eefc2679528";
  console.log(`Checking assignment: ${id}`);

  const assignment = await db.assignment.findUnique({
    where: { id },
    include: {
      module: {
        select: { title: true, courseId: true },
      },
    },
  });

  if (!assignment) {
    console.log("Assignment NOT FOUND in DB.");
  } else {
    console.log("Assignment found:");
    console.log(JSON.stringify(assignment, null, 2));
  }
  process.exit(0);
}

diagnose();
