// backend/src/fabric/scripts/invokeTransaction.ts

import { Gateway, Wallets } from "fabric-network";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

async function main() {
  try {
    // --- SETUP IDENTITAS ---
    const args = process.argv.slice(2);
    const userId = args[0] || "appUser01"; // Default user aplikasi

    console.log(`👤 Menjalankan transaksi sebagai: ${userId}`);

    // 1. Setup Lokasi Connection Profile (CCP)
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "connection-org1.json"
    );

    if (!fs.existsSync(ccpPath)) {
      throw new Error(`File CCP tidak ditemukan di: ${ccpPath}`);
    }
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // 2. Setup Lokasi Wallet
    // 3. Setup Lokasi Wallet
    const walletPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "wallet"
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 3. Cek User di Wallet
    const identity = await wallet.get(userId);
    if (!identity) {
      console.log(`❌ Error: Identity "${userId}" tidak ditemukan di wallet.`);
      console.log("Jalankan registerUser.ts terlebih dahulu.");
      return;
    }

    // 4. Buat Gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true },
    });

    try {
      // 5. Network & Contract
      const channelName = process.env.FABRIC_CHANNEL || "chainnesa";
      const network = await gateway.getNetwork(channelName);
      const contract = network.getContract(process.env.FABRIC_CHAINCODE || "basic");

      // --- DATA SERTIFIKAT DUMMY ---

      const cert_id = uuidv4();
      const name = "Budi Santoso Manual";
      const studentId = "12345678";
      const program = "Pengembangan Perangkat Lunak dan Gim"; // Konsentrasi Keahlian
      const majority = "Teknologi Informasi"; // Bidang Keahlian
      const score = "85.50"; // UKK Score
      const issued_at = new Date().toISOString();
      const hash =
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const status = "ISSUED";

      // --- DATA ISSUER (BARU) ---
      const issuerId = "ADMIN_TEST_CLI";
      const issuerRole = "admin";

      console.log(`🚀 Mengirim transaksi IssueCertificate...`);
      console.table({
        UUID: cert_id,
        Name: name,
        Status: status,
        Issuer: issuerId,
      });

      // 6. Submit Transaction (12 ARGUMEN)
      // Urutan: certId, name, studentId, program, majority, score, issuedAt, hash, cid, status, issuerId, issuerRole
      await contract.submitTransaction(
        "IssueCertificate",
        cert_id,
        name,
        studentId,
        program,
        majority,
        score, // Arg 6: UKK Score
        issued_at,
        hash,
        cid,
        status,
        issuerId, // Arg 11
        issuerRole // Arg 12
      );

      console.log("✅ SUKSES: Sertifikat berhasil diterbitkan di Blockchain!");
      console.log(`ℹ️  Simpan UUID ini untuk tes verifikasi: ${cert_id}`);
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Gagal submit transaksi: ${error}`);
    process.exit(1);
  }
}

main();
