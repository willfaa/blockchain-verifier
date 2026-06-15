// backend/src/fabric/client.ts
import { Gateway, Wallets, Contract, X509Identity } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv"; // Tambahkan ini agar aman
import { CertificateRecord } from "../types";

// --- LOAD ENV FILE ---
// Pastikan file .env terbaca sebelum variabel didefinisikan
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// --- KONFIGURASI ENV & PATH ---
const CHANNEL_NAME = process.env.FABRIC_CHANNEL || "mychannel";
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE || "basic";
const MSPID = process.env.FABRIC_MSPID || "Org1MSP";
const IDENTITY_LABEL = process.env.FABRIC_IDENTITY_LABEL || "appUser";

// --- LOGIC STRICT BOOLEAN ---
// Hapus logika '|| "true"' agar sistem patuh 100% pada .env
// Jika di .env tidak ada, defaultnya FALSE (agar ketahuan kalau lupa set)
const DISCOVERY_ENABLED = process.env.FABRIC_DISCOVERY === "true";
const AS_LOCALHOST =
  process.env.AS_LOCALHOST === "true" ||
  process.env.FABRIC_ASLOCALHOST === "true";

// FUNGSI SMART CONTRACT
const FUNC_ISSUE = "IssueCertificate";
const FUNC_READ = "ReadCertificate";
const FUNC_LIST = "GetAllCertificates";
const FUNC_REVOKE = "RevokeCertificate";

// --- PATH DEFINITIONS ---
const CCP_PATH = path.join(
  process.cwd(),
  "fabric-network",
  "connection-org1.json",
);
const WALLET_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "fabric-network",
  "wallet",
);

function loadConnectionProfile() {
  if (!fs.existsSync(CCP_PATH)) {
    throw new Error(`Connection profile tidak ditemukan di: ${CCP_PATH}`);
  }
  const ccpJSON = fs.readFileSync(CCP_PATH, "utf8");
  return JSON.parse(ccpJSON);
}

// Helper: Determine wallet path based on role
function getWalletPath(role?: string): string {
  const root = WALLET_PATH;
  if (role === "teacher" || role === "lecture")
    return path.join(root, "lecture");
  if (role === "student") return path.join(root, "student");
  return root; // Default/Admin
}

// Helper Utama: Koneksi ke Gateway
export async function getContract(
  userId?: string,
  role?: string,
  chaincodeName: string = CHAINCODE_NAME,
): Promise<{ gateway: Gateway; contract: Contract }> {
  const ccp = loadConnectionProfile();

  // 1. Determine Wallet Path
  const targetWalletPath = userId ? getWalletPath(role) : getWalletPath();
  const wallet = await Wallets.newFileSystemWallet(targetWalletPath);

  // 2. Determine Identity Label
  const identityName = userId || IDENTITY_LABEL;

  // 3. Check Identity
  const identity = await wallet.get(identityName);
  if (!identity) {
    console.error(
      `❌ Identity "${identityName}" not found in wallet: ${targetWalletPath}`,
    );
    throw new Error(`Identity ${identityName} not found in user wallet`);
  }

  // Connect Gateway
  const gateway = new Gateway();

  await gateway.connect(ccp, {
    wallet,
    identity: identityName,
    discovery: {
      enabled: DISCOVERY_ENABLED,
      asLocalhost: AS_LOCALHOST,
    },
  });

  // Get Network & Contract
  const network = await gateway.getNetwork(CHANNEL_NAME);
  // Use dynamic chaincode name (default: basic, or qscc for system)
  const contract = network.getContract(chaincodeName);
  return { gateway, contract };
}

// --- EXPLORER FUNCTIONS (QSCC) ---

export async function getBlockchainInfo(username: string, role: string) {
  // Query System Chaincode (QSCC) -> GetChainInfo
  const { contract, gateway } = await getContract(username, role, "qscc");
  try {
    console.log(`Explorer: Fetching ChainInfo for ${CHANNEL_NAME}...`);

    // Arg1: GetChainInfo, Arg2: ChannelName
    const resultBuffer = await contract.evaluateTransaction(
      "GetChainInfo",
      CHANNEL_NAME,
    );

    // Result is a Protobuf byte array in standard Fabric, BUT
    // using fabric-network usually returns a buffer we need to decode.
    // However, for pure JSON explorer simplicity, we might only get raw bytes.
    // NOTE: 'GetChainInfo' returns a serialized common.BlockchainInfo.
    // Decoding protobuf in JS requires 'fabric-protos' or manual parsing.
    // To keep it simple without heavy deps: We return Base64 or try rudimentary parsing if possible.
    // For now, let's return the simplified standard format if the node SDK decodes it,
    // otherwise we might need a specifically crafted query or separate decoder.

    // UPDATE: To avoid Protobuf complexity, we will rely on a lighter approach:
    // Just return the raw buffer items (Height, CurrentBlockHash, PreviousBlockHash).
    // The node-sdk might not auto-decode QSCC responses to JSON.
    // Start with basic props.

    // Note: If direct QSCC proves too hard without protos, we will stick to
    // GetAllCertificates for the "Explorer" first.

    // Let's try to just return the buffer JSON representation for inspection.
    const resultJson = resultBuffer.toJSON();
    return resultJson;
  } catch (error: any) {
    console.error(`Failed to get blockchain info: ${error}`);
    throw new Error(error.message);
  } finally {
    gateway.disconnect();
  }
}

// --- PUBLIC FUNCTIONS ---

export async function issueCertificateOnFabric(
  record: CertificateRecord,
  issuerId: string,
  issuerRole: string,
): Promise<void> {
  const { gateway, contract } = await getContract(issuerId, issuerRole);
  try {
    console.log(
      `⚡ Submitting Issue to Fabric: ${record.certId} by ${issuerId}`,
    );

    await contract.submitTransaction(
      FUNC_ISSUE,
      record.certId,
      record.name,
      record.studentId, // Arg 3: Student ID
      record.program, // Arg 4
      record.majority, // Arg 5
      record.issuedAt, // Arg 6
      record.hash, // Arg 7
      record.cid, // Arg 8
      record.status, // Arg 9
      record.nonce, // Arg 10
      issuerId, // Arg 11
      issuerRole, // Arg 12
    );
    console.log("✅ Fabric Transaction Committed");
  } catch (err: any) {
    console.error("❌ Fabric Submit Failed!");
    if (err.responses) console.error("   Responses:", err.responses);
    if (err.endorsements) console.error("   Endorsements:", err.endorsements);
    throw err;
  } finally {
    gateway.disconnect();
  }
}

export async function revokeCertificateOnFabric(
  certId: string,
  revocationReason: string,
  revokedAt: string,
): Promise<void> {
  const { gateway, contract } = await getContract();
  try {
    await contract.submitTransaction(
      FUNC_REVOKE,
      certId,
      revocationReason,
      revokedAt,
    );
  } finally {
    gateway.disconnect();
  }
}

export async function getCertificateFromFabric(
  certId: string,
): Promise<CertificateRecord | null> {
  const { gateway, contract } = await getContract();
  try {
    const result = await contract.evaluateTransaction(FUNC_READ, certId);
    const txt = result.toString("utf8").trim();
    if (!txt) return null;
    return JSON.parse(txt) as CertificateRecord;
  } catch (err: any) {
    if (String(err?.message || "").includes("does not exist")) return null;
    throw err;
  } finally {
    gateway.disconnect();
  }
}

export async function getCertificatesFromFabric(): Promise<
  CertificateRecord[]
> {
  const { gateway, contract } = await getContract();
  try {
    const result = await contract.evaluateTransaction(FUNC_LIST);
    const txt = result.toString("utf8").trim();
    if (!txt) return [];
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? (parsed as CertificateRecord[]) : [];
  } finally {
    gateway.disconnect();
  }
}

// --- FUNGSI REGISTER USER ---
export async function registerFabricUser(
  userId: string,
  role: string,
): Promise<void> {
  try {
    const ccp = loadConnectionProfile();
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName,
    );

    const adminWallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    let targetWalletPath = WALLET_PATH;
    if (role === "student") {
      targetWalletPath = path.join(WALLET_PATH, "student");
    } else if (role === "teacher") {
      targetWalletPath = path.join(WALLET_PATH, "lecture");
    }

    const userWallet = await Wallets.newFileSystemWallet(targetWalletPath);
    console.log(`📂 Target Wallet Path for ${userId}: ${targetWalletPath}`);

    const userIdentity = await userWallet.get(userId);
    if (userIdentity) {
      console.log(`⚠️ Identity "${userId}" already exists in wallet.`);
      return;
    }

    const adminIdentity = await adminWallet.get("admin");
    if (!adminIdentity) {
      throw new Error(
        'Identity "admin" not found in root wallet. Run enrollAdmin.ts first.',
      );
    }

    const provider = adminWallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    console.log(`⏳ Registering Fabric user: ${userId} (${role})...`);
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: userId,
        role: "client",
      },
      adminUser,
    );

    console.log(`⏳ Enrolling Fabric user: ${userId}...`);
    const enrollment = await ca.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret,
    });

    const x509Identity: X509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: MSPID,
      type: "X.509",
    };
    await userWallet.put(userId, x509Identity);
    console.log(`✅ Successfully registered: ${userId} at ${targetWalletPath}`);
  } catch (err: any) {
    console.error(`❌ Failed to register Fabric user ${userId}:`, err);
    throw err;
  }
}

export async function checkFabricReady(
  userId?: string,
  role?: string,
): Promise<boolean> {
  const { gateway } = await getContract(userId, role);
  try {
    // If we got here, we successfully connected to the gateway and channel
    return true;
  } finally {
    gateway.disconnect();
  }
}

export async function getAllCertificatesFromFabric(
  username: string,
  role: string,
) {
  try {
    // Gunakan getContract yang sudah ada
    const { contract, gateway } = await getContract(username, role);

    console.log(`Fabric Client: Fetching ALL certificates for ${username}...`);

    // PENTING: Gunakan 'evaluateTransaction' (Read-Only)
    const resultBuffer =
      await contract.evaluateTransaction("GetAllCertificates");

    // Parse hasil
    const resultString = resultBuffer.toString();
    const resultJSON = JSON.parse(resultString);

    gateway.disconnect();
    return resultJSON;
  } catch (error: any) {
    console.error(`Failed to get all certificates: ${error}`);
    throw new Error(error.message);
  }
}
