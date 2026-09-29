import { db } from "../src/config/db";
import { syncPendingCertificatesToFabric } from "../src/fabric/client";

async function main() {
  console.log("1. Finding all certificates in DB...");
  const count = await db.certificate.count();
  console.log(`Total certificates in DB: ${count}`);

  if (count === 0) {
    console.log("No certificates in DB to sync.");
    return;
  }

  console.log("2. Setting all certificate blockchainSyncStatus to 'PENDING_SYNC'...");
  const updateRes = await db.certificate.updateMany({
    data: {
      blockchainSyncStatus: "PENDING_SYNC",
    },
  });
  console.log(`Updated ${updateRes.count} certificate(s) to PENDING_SYNC.`);

  console.log("3. Triggering Fabric Sync...");
  const result = await syncPendingCertificatesToFabric();

  console.log("\n=======================================================");
  console.log(`🎉 FORCE SYNC RESULT:`);
  console.log(`   • Total Processed : ${result.count}`);
  console.log(`   • Successfully Synced : ${result.synced.length}`);
  console.log(`   • Failed : ${result.errors.length}`);
  console.log("=======================================================\n");

  if (result.errors.length > 0) {
    console.error("Errors:", result.errors);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("Error:", e); process.exit(1); });
