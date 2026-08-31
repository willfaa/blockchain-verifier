import dotenv from "dotenv";
dotenv.config();
import { checkFabricReady } from "../src/fabric/client";
import { db } from "../src/config/db";

async function testHealth() {
  console.log("=== Health Check Diagnostic ===");
  console.log("process.cwd():", process.cwd());
  console.log("FABRIC_ENABLED:", process.env.FABRIC_ENABLED);

  // 1. Test Fabric
  const startTime = Date.now();
  let isFabricOnline = false;
  try {
    const fabricCheckPromise = checkFabricReady("admin", "admin");
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fabric health check timed out")), 5000)
    );
    await Promise.race([fabricCheckPromise, timeoutPromise]);
    isFabricOnline = true;
    console.log(`✅ Fabric Health Check SUCCESS in ${Date.now() - startTime}ms`);
  } catch (err: any) {
    console.error(`❌ Fabric Health Check FAILED in ${Date.now() - startTime}ms:`, err.message);
    if (err.stack) console.error(err.stack);
  }

  // 2. Test DB
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("✅ Database query SELECT 1 SUCCESS");
  } catch (err: any) {
    console.error("❌ Database query FAILED:", err.message);
  }

  console.log("\nSummary Result:");
  console.log("Fabric isOnline:", isFabricOnline);
}

testHealth().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
