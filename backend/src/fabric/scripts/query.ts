//backend/src/fabric/scripts/query.ts
import { Gateway, Wallets } from "fabric-network";
import * as path from "path";
import * as fs from "fs";
import "dotenv/config";

async function main() {
  try {
    // --- 1. AMBIL ARGUMEN ---
    // Usage: npx ts-node src/fabric/scripts/query.ts <UUID>  ATAU  query.ts all
    const args = process.argv.slice(2);
    const queryTarget = args[0];
    const userId = "appUser01";

    if (!queryTarget) {
      console.log('⚠️  Harap masukkan UUID target atau ketik "all"');
      return;
    }

    // --- 2. CONFIG ---
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // backend/src/fabric/scripts/query.ts -> backend/fabric-network/wallet
    const walletPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "wallet"
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get(userId);
    if (!identity) {
      console.log(`❌ Error: Identity "${userId}" tidak ditemukan.`);
      return;
    }

    // --- 3. CONNECT ---
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true },
    });

    try {
      const channelName = process.env.FABRIC_CHANNEL || "chainnesa";
      const network = await gateway.getNetwork(channelName);
      const contract = network.getContract(process.env.FABRIC_CHAINCODE || "basic");

      let result;

      // --- 4. EVALUATE (READ ONLY) ---
      if (queryTarget === "all") {
        console.log("\n🔎 Mengambil SEMUA sertifikat...");
        result = await contract.evaluateTransaction("GetAllCertificates");
      } else {
        console.log(`\n🔎 Mencari UUID: ${queryTarget}...`);
        result = await contract.evaluateTransaction(
          "ReadCertificate",
          queryTarget
        );
      }

      // --- 5. RESULT ---
      const resultString = result.toString();
      if (!resultString) {
        console.log("⚠️  Data kosong.");
        return;
      }

      const resultJSON = JSON.parse(resultString);
      console.log("✅ HASIL QUERY:");
      console.dir(resultJSON, { depth: null, colors: true });
    } finally {
      gateway.disconnect();
    }
  } catch (error) {
    console.error(`❌ Gagal Query: ${error}`);
  }
}

main();
