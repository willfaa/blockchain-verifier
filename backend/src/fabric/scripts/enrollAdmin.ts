//backend/src/fabric/scripts/enrollAdmin.ts
import FabricCAServices from "fabric-ca-client";
import { Wallets, X509Identity } from "fabric-network";
import * as path from "path";
import * as fs from "fs";
import "dotenv/config";

async function main() {
  try {
    // 1. Setup Konfigurasi Koneksi (CCP)
    // Mundur 3 level dari src/fabric/scripts ke root backend
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "connection-org1.json"
    );

    if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile tidak ditemukan di: ${ccpPath}`);
    }
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // 2. Setup CA Client
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // 3. Setup Wallet (Backend/fabric-network/wallet)
    const walletPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "wallet"
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`📂 Wallet path: ${walletPath}`);

    // 4. Cek apakah admin sudah ada
    const identity = await wallet.get("admin");
    if (identity) {
      console.log('⚠️  Identity "admin" sudah ada di wallet');
      return;
    }

    // 5. Enroll Admin
    console.log("⏳ Menghubungi CA...");
    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw",
    });

    // 6. Import ke Wallet
    const x509Identity: X509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await wallet.put("admin", x509Identity);
    console.log("✅ SUKSES: Admin berhasil didaftarkan ke Wallet!");
  } catch (error) {
    console.error(`❌ Gagal enroll admin: ${error}`);
    process.exit(1);
  }
}

main();
