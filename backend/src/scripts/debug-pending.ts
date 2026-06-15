import { db } from "../config/db";

async function main() {
  try {
    console.log("Testing Pending Users Query...");
    const users = await db.user.findMany({
      where: { isApproved: false },
      select: { id: true, email: true },
    });
    console.log("Success!", users);
  } catch (err) {
    console.error("Query Failed:", err);
  } finally {
    process.exit();
  }
}

main();
