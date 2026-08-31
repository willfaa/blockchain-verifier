import dotenv from "dotenv";
dotenv.config();
import path from "path";
import fs from "fs";
import { Gateway, Wallets } from "fabric-network";

async function diagnose() {
  console.log("=========================================");
  console.log("HYPERLEDGER FABRIC DIAGNOSTIC");
  console.log("=========================================");
  console.log("process.cwd():", process.cwd());
  console.log("FABRIC_ENABLED:", process.env.FABRIC_ENABLED);
  console.log("FABRIC_CHANNEL:", process.env.FABRIC_CHANNEL);
  console.log("FABRIC_CHAINCODE:", process.env.FABRIC_CHAINCODE);
  console.log("FABRIC_MSPID:", process.env.FABRIC_MSPID);
  console.log("FABRIC_IDENTITY_LABEL:", process.env.FABRIC_IDENTITY_LABEL);
  console.log("FABRIC_DISCOVERY:", process.env.FABRIC_DISCOVERY);
  console.log("FABRIC_ASLOCALHOST:", process.env.FABRIC_ASLOCALHOST);

  const ccpPath = path.join(process.cwd(), "fabric-network", "connection-org1.json");
  console.log("\n1. Checking connection profile at:", ccpPath);
  if (!fs.existsSync(ccpPath)) {
    console.error("❌ Connection profile NOT FOUND at:", ccpPath);
    return;
  }
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
  console.log("✅ Connection profile loaded.");
  console.log("   Peers in CCP:", Object.keys(ccp.peers || {}));
  console.log("   Orderers in CCP:", Object.keys(ccp.orderers || {}));
  console.log("   Certificate Authorities in CCP:", Object.keys(ccp.certificateAuthorities || {}));

  const walletPath = path.resolve(__dirname, "..", "fabric-network", "wallet");
  console.log("\n2. Checking wallet at:", walletPath);
  if (!fs.existsSync(walletPath)) {
    console.error("❌ Wallet directory NOT FOUND at:", walletPath);
    return;
  }
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const identities = await wallet.list();
  console.log("   Identities in wallet:", identities);

  const adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    console.error("❌ 'admin' identity not found in wallet!");
  } else {
    console.log("✅ 'admin' identity found in wallet. MSP ID:", adminIdentity.mspId);
    console.log("   Certificate excerpt:", ((adminIdentity as any).credentials?.certificate || "").substring(0, 100).replace(/\n/g, "") + "...");
  }

  console.log("\n3. Attempting Gateway.connect()...");
  const gateway = new Gateway();
  try {
    const asLocalhost = process.env.FABRIC_ASLOCALHOST !== "false";
    const discoveryEnabled = process.env.FABRIC_DISCOVERY === "true";
    console.log(`   Connecting with discovery=${discoveryEnabled}, asLocalhost=${asLocalhost}...`);
    
    await gateway.connect(ccp, {
      wallet,
      identity: "admin",
      discovery: {
        enabled: discoveryEnabled,
        asLocalhost: asLocalhost,
      },
    });
    console.log("✅ Gateway connected successfully!");

    console.log("\n4. Getting network:", process.env.FABRIC_CHANNEL || "mychannel");
    const network = await gateway.getNetwork(process.env.FABRIC_CHANNEL || "mychannel");
    console.log("✅ Got network!");

    console.log("\n5. Getting contract:", process.env.FABRIC_CHAINCODE || "basic");
    const contract = network.getContract(process.env.FABRIC_CHAINCODE || "basic");
    console.log("✅ Got contract!");

    console.log("\n6. Evaluating transaction GetAllCertificates...");
    const resBuffer = await contract.evaluateTransaction("GetAllCertificates");
    console.log("✅ Transaction evaluated successfully!");
    const resString = resBuffer.toString();
    console.log("   Result length:", resString.length);
    console.log("   First 200 chars:", resString.substring(0, 200));

  } catch (err: any) {
    console.error("❌ ERROR during Gateway connection / transaction:", err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    gateway.disconnect();
    console.log("\nGateway disconnected.");
  }
}

diagnose().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
