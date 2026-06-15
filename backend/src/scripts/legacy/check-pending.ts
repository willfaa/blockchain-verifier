import { db } from "../config/db";

async function main() {
  try {
    console.log("--- DEBUG START ---");
    // Check if isApproved exists and works
    const pendingCount = await db.user.count({
      where: { isApproved: false },
    });
    console.log(`Pending Users Count: ${pendingCount}`);

    const allUsers = await db.user.count();
    console.log(`Total Users Count: ${allUsers}`);

    if (pendingCount > 0) {
      const sample = await db.user.findFirst({
        where: { isApproved: false },
        select: { email: true, isApproved: true },
      });
      console.log("Sample Pending User:", sample);
    }
    console.log("--- DEBUG END ---");
  } catch (err: any) {
    console.error("CRITICAL DATABASE ERROR:", err.message);
    if (err.message.includes("Column")) {
      console.log(
        "Diagnosis: Schema mismatch. The column isApproved might be missing in DB."
      );
    }
  } finally {
    process.exit();
  }
}

main();
