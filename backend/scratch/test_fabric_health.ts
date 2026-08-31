import dotenv from "dotenv";
dotenv.config();
import { checkFabricReady } from "../src/fabric/client";

async function testHealth() {
  console.log("=== Testing Reactive Fabric Health Check ===");
  const start = Date.now();
  const isOnline = await checkFabricReady("admin", "admin", true);
  const duration = Date.now() - start;
  console.log(`Fabric Ready Check: ${isOnline ? "ONLINE (Reachable)" : "OFFLINE (Unreachable)"} (Took: ${duration}ms)`);
}

testHealth()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Health check error:", e);
    process.exit(1);
  });
