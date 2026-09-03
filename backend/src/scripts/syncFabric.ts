import dotenv from "dotenv";
dotenv.config();
import { syncPendingCertificatesToFabric, checkFabricReady } from "../fabric/client";

async function main() {
  console.log("\n=======================================================");
  console.log("🔗 HYPERLEDGER FABRIC - CLOUD LEDGER SYNC PROTOCOL");
  console.log("=======================================================\n");

  console.log("1. Checking connection to local Hyperledger Fabric network...");
  const isReady = await checkFabricReady("admin", "admin");

  if (!isReady) {
    console.error("❌ Fabric connection failed! Please make sure Docker containers are running:");
    console.error("   - peer0.org1.example.com:7051");
    console.error("   - ca_org1:7054");
    console.error("   - orderer.example.com:7050\n");
    process.exit(1);
  }

  const ch = process.env.FABRIC_CHANNEL || "chainnesa";
  console.log(`✅ Fabric Network Online and Authenticated (Org1MSP / channel: ${ch}).\n`);
  console.log("2. Scanning Supabase Cloud for PENDING_SYNC certificates...");

  const result = await syncPendingCertificatesToFabric();

  console.log("\n=======================================================");
  console.log(`🎉 SINKRONISASI SELESAI:`);
  console.log(`   • Total Diproses : ${result.count} sertifikat`);
  console.log(`   • Berhasil Sync  : ${result.synced.length} sertifikat`);
  console.log(`   • Gagal          : ${result.errors.length}`);
  console.log("=======================================================\n");

  if (result.synced.length > 0) {
    console.log("Daftar Certificate ID yang telah masuk ke Blockchain on-chain:");
    result.synced.forEach((id, idx) => console.log(`   ${idx + 1}. ${id}`));
    console.log("\nStatus di Supabase Cloud telah diperbarui menjadi SYNCED secara otomatis.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Sync Script Error:", err);
    process.exit(1);
  });
