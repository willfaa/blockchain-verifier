import { db } from "../config/db";

async function diag() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isApproved: true,
        isActive: true,
      },
    });
    console.log("=== USER REGISTRY DIAGNOSTICS ===");
    console.table(users);
  } catch (error) {
    console.error("Diag failed:", error);
  } finally {
    process.exit();
  }
}

diag();
