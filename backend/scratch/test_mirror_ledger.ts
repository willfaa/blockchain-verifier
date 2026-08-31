import dotenv from "dotenv";
dotenv.config();
import { db } from "../src/config/db";
import { syncPendingCertificatesToFabric } from "../src/fabric/client";

async function testMirrorLedger() {
  console.log("=== Testing Hybrid Mirror Ledger & Sync Queue ===");

  // 1. Check sync stats
  const [pending, synced, failed] = await Promise.all([
    db.certificate.count({ where: { blockchainSyncStatus: "PENDING_SYNC" } }),
    db.certificate.count({ where: { blockchainSyncStatus: "SYNCED" } }),
    db.certificate.count({ where: { blockchainSyncStatus: "FAILED" } }),
  ]);

  console.log(`Current Ledger Status:`);
  console.log(`- Synced on Blockchain: ${synced}`);
  console.log(`- Pending Queue: ${pending}`);
  console.log(`- Failed: ${failed}`);

  // 2. Test sync function
  const result = await syncPendingCertificatesToFabric();
  console.log("Sync Function Execution Result:", result);

  console.log("✅ Mirror Ledger test completed cleanly.");
}

testMirrorLedger()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Mirror Ledger test failed:", err);
    process.exit(1);
  });
