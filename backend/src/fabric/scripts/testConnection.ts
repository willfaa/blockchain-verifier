// backend/src/fabric/scripts/testConnection.ts
import { getCertificatesFromFabric } from "../client";
import "dotenv/config";

async function main() {
  console.log("🔄 MENGECEK KONEKSI KE HYPERLEDGER FABRIC...");
  console.log(`📂 Wallet Path: ${process.cwd()}/fabric-network/wallet`);
  console.log(`👤 User Identity: ${process.env.FABRIC_IDENTITY_LABEL}`);
  console.log(`CHANNEL: ${process.env.FABRIC_CHANNEL}`);
  console.log(`CHAINCODE: ${process.env.FABRIC_CHAINCODE}`);

  try {
    const startTime = Date.now();

    // Kita coba panggil fungsi "GetAllCertificates" (Read Only)
    // Jika ini berhasil, berarti Gateway, Wallet, dan Chaincode sehat.
    const certs = await getCertificatesFromFabric();

    const duration = Date.now() - startTime;

    console.log("\n✅ KONEKSI SUKSES!");
    console.log(`⏱️  Durasi Ping: ${duration}ms`);
    console.log(`📄 Jumlah Sertifikat di Ledger: ${certs.length}`);

    if (certs.length > 0) {
      console.log("🔍 Contoh Data Terakhir:", certs[certs.length - 1]);
    } else {
      console.log("ℹ️  Ledger masih kosong (Aman).");
    }
  } catch (error: any) {
    console.error("\n❌ KONEKSI GAGAL!");
    console.error("Penyebab:", error.message);

    if (error.message.includes("Identity")) {
      console.error(
        "👉 TIP: Cek .env 'FABRIC_IDENTITY_LABEL' apakah sesuai dengan isi folder wallet?"
      );
    }
    if (error.message.includes("Connection profile")) {
      console.error(
        "👉 TIP: Cek apakah file connection-org1.json ada di folder fabric-network?"
      );
    }
  }
}

main();
