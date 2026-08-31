// backend/src/fabric/client.ts
import { Gateway, Wallets, Contract, X509Identity } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv"; // Tambahkan ini agar aman
import { CertificateRecord } from "../types";
import { db } from "../config/db";

// --- LOAD ENV FILE ---
// Pastikan file .env terbaca sebelum variabel didefinisikan
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// --- KONFIGURASI ENV & PATH ---
const CHANNEL_NAME = process.env.FABRIC_CHANNEL || "mychannel";
const CHAINCODE_NAME = process.env.FABRIC_CHAINCODE || "basic";
const MSPID = process.env.FABRIC_MSPID || "Org1MSP";
const IDENTITY_LABEL = process.env.FABRIC_IDENTITY_LABEL || "admin";

// --- LOGIC STRICT BOOLEAN ---
const DISCOVERY_ENABLED = process.env.FABRIC_DISCOVERY === "true";
const AS_LOCALHOST =
  process.env.AS_LOCALHOST === "true" ||
  process.env.FABRIC_ASLOCALHOST === "true";

// FUNGSI SMART CONTRACT
const FUNC_ISSUE = "IssueCertificate";
const FUNC_READ = "ReadCertificate";
const FUNC_LIST = "GetAllCertificates";
const FUNC_REVOKE = "RevokeCertificate";
const FUNC_SUPERSEDE = "SupersedeCertificate";

// --- RESILIENT PATH DEFINITIONS ---
function getCcpPath(): string {
  const envPath = process.env.FABRIC_CONN_PROFILE;
  const candidates = [
    envPath ? (path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath)) : null,
    path.resolve(__dirname, "../../fabric-network/connection-org1.json"),
    path.resolve(__dirname, "../fabric-network/connection-org1.json"),
    path.join(process.cwd(), "fabric-network", "connection-org1.json"),
    path.join(process.cwd(), "backend", "fabric-network", "connection-org1.json"),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return path.resolve(__dirname, "../../fabric-network/connection-org1.json");
}

function getWalletRootPath(): string {
  const candidates = [
    path.resolve(__dirname, "../../fabric-network/wallet"),
    path.resolve(__dirname, "../fabric-network/wallet"),
    path.join(process.cwd(), "fabric-network", "wallet"),
    path.join(process.cwd(), "backend", "fabric-network", "wallet"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return path.resolve(__dirname, "../../fabric-network/wallet");
}

function loadConnectionProfile() {
  const ccpPath = getCcpPath();
  if (!fs.existsSync(ccpPath)) {
    throw new Error(`Connection profile tidak ditemukan di: ${ccpPath}`);
  }
  const ccpJSON = fs.readFileSync(ccpPath, "utf8");
  return JSON.parse(ccpJSON);
}

// Helper: Determine wallet path based on role
function getWalletPath(role?: string): string {
  const root = getWalletRootPath();
  const normalized = (role || "").toLowerCase();
  if (normalized === "teacher" || normalized === "lecture")
    return path.join(root, "lecture");
  if (normalized === "student") return path.join(root, "student");
  return root; // Default/Admin
}

// Helper Utama: Koneksi ke Gateway dengan JIT Enrollment & Fallback
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
  let identity = await wallet.get(identityName);

  // JIT Auto-Enrollment: Jika user belum punya identitas di wallet, buatkan secara otomatis
  if (!identity && userId && userId !== IDENTITY_LABEL && userId !== "admin") {
    try {
      console.log(`⚡ [JIT Enrollment] Identity "${identityName}" missing in wallet, attempting auto-enroll...`);
      await registerFabricUser(userId, role || "student");
      identity = await wallet.get(identityName);
    } catch (enrollErr: any) {
      console.warn(`[JIT Enrollment Notice for ${identityName}]:`, enrollErr.message);
    }
  }

  // Gateway Connection
  const gateway = new Gateway();

  if (identity) {
    await gateway.connect(ccp, {
      wallet,
      identity: identityName,
      discovery: {
        enabled: DISCOVERY_ENABLED,
        asLocalhost: AS_LOCALHOST,
      },
    });
  } else {
    // Graceful Fallback ke Admin Identity di Root Wallet
    const adminWallet = await Wallets.newFileSystemWallet(getWalletRootPath());
    const adminIdentity = await adminWallet.get("admin") || await adminWallet.get(IDENTITY_LABEL);
    if (adminIdentity) {
      console.warn(`⚠️ [Fabric Fallback] Using admin identity as fallback for "${identityName}".`);
      await gateway.connect(ccp, {
        wallet: adminWallet,
        identity: "admin",
        discovery: {
          enabled: DISCOVERY_ENABLED,
          asLocalhost: AS_LOCALHOST,
        },
      });
    } else {
      console.error(`❌ Identity "${identityName}" not found in wallet: ${targetWalletPath}`);
      throw new Error(`Identity ${identityName} not found in user wallet`);
    }
  }

  // Get Network & Contract
  const network = await gateway.getNetwork(CHANNEL_NAME);
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
      record.studentId, // Arg 3: Student ID (NISN)
      record.program, // Arg 4: Konsentrasi Keahlian
      record.majority, // Arg 5: Bidang Keahlian
      record.score || "", // Arg 6: UKK Score
      record.issuedAt, // Arg 7
      record.hash, // Arg 8
      record.cid, // Arg 9
      record.status, // Arg 10
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

export async function supersedeCertificateOnFabric(
  oldCertId: string,
  newCertId: string,
  reason: string,
): Promise<void> {
  const { gateway, contract } = await getContract();
  try {
    console.log(`🔄 Superseding certificate on Fabric: ${oldCertId} -> ${newCertId} (Reason: ${reason})`);
    await contract.submitTransaction(
      FUNC_SUPERSEDE,
      oldCertId,
      newCertId,
      reason,
    );
    console.log(`✅ Fabric Supersede Transaction Committed`);
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

    const walletRoot = getWalletRootPath();
    const adminWallet = await Wallets.newFileSystemWallet(walletRoot);

    let targetWalletPath = walletRoot;
    if (role === "student") {
      targetWalletPath = path.join(walletRoot, "student");
    } else if (role === "teacher") {
      targetWalletPath = path.join(walletRoot, "lecture");
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

let lastHealthCheckTime = 0;
let lastHealthCheckResult = false;
const HEALTH_CACHE_TTL = 8000; // 8 seconds cache to prevent peer TLS throttling

export async function checkFabricReady(
  userId?: string,
  role?: string,
  bypassCache: boolean = false,
): Promise<boolean> {
  const now = Date.now();
  if (!bypassCache && now - lastHealthCheckTime < HEALTH_CACHE_TTL) {
    if (lastHealthCheckResult) return true;
  }

  try {
    const { gateway } = await getContract(userId, role);
    gateway.disconnect();
    lastHealthCheckResult = true;
    lastHealthCheckTime = Date.now();
    return true;
  } catch (err: any) {
    lastHealthCheckResult = false;
    lastHealthCheckTime = Date.now();
    throw err;
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

/**
 * Remove a user's wallet identity file when the user is deleted from the database.
 * Also optionally revokes the user certificate from Fabric CA.
 */
export async function removeFabricUserWallet(
  identifier: string,
  role?: string,
): Promise<boolean> {
  try {
    const walletRoot = getWalletRootPath();
    const targetPaths = [
      walletRoot,
      path.join(walletRoot, "student"),
      path.join(walletRoot, "lecture"),
    ];

    let removed = false;
    for (const p of targetPaths) {
      if (fs.existsSync(p)) {
        try {
          const wallet = await Wallets.newFileSystemWallet(p);
          const exists = await wallet.get(identifier);
          if (exists) {
            await wallet.remove(identifier);
            console.log(`🗑️ [Wallet Drop] Removed Fabric wallet identity "${identifier}" from ${p}`);
            removed = true;
          }
        } catch (wErr: any) {
          // ignore
        }

        // Check if raw .id file exists on disk directly
        const rawFilePath = path.join(p, `${identifier}.id`);
        if (fs.existsSync(rawFilePath)) {
          fs.unlinkSync(rawFilePath);
          console.log(`🗑️ [Wallet Drop] Deleted file ${rawFilePath}`);
          removed = true;
        }
      }
    }

    // Attempt CA Revocation if CA is available
    try {
      const ccp = loadConnectionProfile();
      const caInfo = ccp.certificateAuthorities?.["ca.org1.example.com"];
      if (caInfo) {
        const ca = new FabricCAServices(
          caInfo.url,
          { trustedRoots: caInfo.tlsCACerts.pem, verify: false },
          caInfo.caName
        );
        const adminWallet = await Wallets.newFileSystemWallet(walletRoot);
        const adminIdentity = await adminWallet.get("admin");
        if (adminIdentity) {
          const provider = adminWallet.getProviderRegistry().getProvider(adminIdentity.type);
          const adminUser = await provider.getUserContext(adminIdentity, "admin");
          await ca.revoke({ enrollmentID: identifier, reason: "User deleted from system registry" }, adminUser);
          console.log(`🔒 [CA Revocation] Successfully revoked Fabric certificate for "${identifier}"`);
        }
      }
    } catch (caErr: any) {
      // CA revocation errors can be safely ignored if user was never enrolled or already revoked
    }

    return removed;
  } catch (err: any) {
    console.error(`❌ Failed to remove wallet for ${identifier}:`, err.message);
    return false;
  }
}

/**
 * Auto-Sync Fabric Wallet on Server Startup.
 * Checks Admin enrollment, and ensures active DB users have identities in the wallet.
 */
export async function autoSyncFabricWallet(): Promise<void> {
  if (process.env.FABRIC_ENABLED !== "true") return;

  try {
    const ccp = loadConnectionProfile();
    const caInfo = ccp.certificateAuthorities?.["ca.org1.example.com"];
    if (!caInfo) return;

    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caInfo.tlsCACerts.pem, verify: false },
      caInfo.caName
    );

    const walletRoot = getWalletRootPath();
    const adminWallet = await Wallets.newFileSystemWallet(walletRoot);

    // 1. Ensure Admin identity exists
    let adminIdentity = (await adminWallet.get("admin")) as X509Identity | undefined;
    if (!adminIdentity) {
      console.log("👤 [AutoSync] Enrolling Admin identity from Fabric CA...");
      const enrollment = await ca.enroll({
        enrollmentID: "admin",
        enrollmentSecret: "adminpw",
      });
      adminIdentity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: MSPID,
        type: "X.509",
      };
      await adminWallet.put("admin", adminIdentity);
      console.log("✅ [AutoSync] Admin identity enrolled successfully in wallet.");
    }

    // 2. Fetch users from DB and sync missing wallets
    const users = await db.user.findMany({
      where: {
        role: { not: "admin", mode: "insensitive" as any },
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!users || users.length === 0) return;

    const provider = adminWallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    for (const u of users) {
      const roleStr = (u.role || "student").toLowerCase();
      let targetPath = walletRoot;
      if (roleStr === "student") {
        targetPath = path.join(walletRoot, "student");
      } else if (roleStr === "teacher" || roleStr === "lecture") {
        targetPath = path.join(walletRoot, "lecture");
      }

      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      const userWallet = await Wallets.newFileSystemWallet(targetPath);
      const identifier = u.email;
      if (!identifier) continue;

      const exists = await userWallet.get(identifier);
      if (!exists) {
        try {
          const secret = await ca.register(
            {
              affiliation: "org1.department1",
              enrollmentID: identifier,
              role: "client",
              attrs: [{ name: "role", value: roleStr, ecert: true }],
            },
            adminUser
          );
          const userEnrollment = await ca.enroll({
            enrollmentID: identifier,
            enrollmentSecret: secret,
          });
          const x509: X509Identity = {
            credentials: {
              certificate: userEnrollment.certificate,
              privateKey: userEnrollment.key.toBytes(),
            },
            mspId: MSPID,
            type: "X.509",
          };
          await userWallet.put(identifier, x509);
          console.log(`✅ [AutoSync] Enrolled missing wallet identity for ${identifier} (${roleStr})`);
        } catch (regErr: any) {
          // If already registered in CA or connection busy, skip silently
        }
      }
    }
  } catch (err: any) {
    console.warn("⚠️ [AutoSync Notice]: Fabric AutoSync skipped/deferred:", err.message);
  }
}
