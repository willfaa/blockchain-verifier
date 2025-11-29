// src/fabric.ts
import { Gateway, Wallets, Contract, X509Identity } from "fabric-network";
import * as path from "path";
import * as fs from "fs";
import { CertificateRecord } from "./types";

const CHANNEL_NAME = "mychannel";
const CHAINCODE_NAME = "basic";
const IDENTITY_LABEL = "Org1Admin"; // Admin Org1 syncronized from WSL

function loadConnectionProfile() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "fabric-network",
    "connection-org1.json"
  );
  const ccpJSON = fs.readFileSync(ccpPath, "utf8");
  return JSON.parse(ccpJSON);
}

async function getContract(): Promise<{
  gateway: Gateway;
  contract: Contract;
}> {
  const ccp = loadConnectionProfile();

  // Wallet in backend (filesystem)
  const walletPath = path.resolve(__dirname, "..", "fabric-network", "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  let identity = await wallet.get(IDENTITY_LABEL);

  if (!identity) {
    // === FORCING TO ALWAYS USING REGENERATED  ===
    const certPath = path.resolve(
      __dirname,
      "..",
      "fabric-network",
      "msp",
      "admin-cert.pem"
    );

    const keyPath = path.resolve(
      __dirname,
      "..",
      "fabric-network",
      "msp",
      "admin-key.pem"
    );

    const certificate = fs.readFileSync(certPath, "utf8");
    const privateKey = fs.readFileSync(keyPath, "utf8");

    const x509Identity: X509Identity = {
      credentials: {
        certificate,
        privateKey,
      },
      mspId: "Org1MSP",
      type: "X.509",
    };

    await wallet.put(IDENTITY_LABEL, x509Identity);
    identity = x509Identity;
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: IDENTITY_LABEL,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(CHANNEL_NAME);
  const contract = network.getContract(CHAINCODE_NAME);

  return { gateway, contract };
}

/**
 * When the function called and fault, throw an error,
 * and /issue should consider issuing was error
 */
export async function issueCertificateOnFabric(
  record: CertificateRecord
): Promise<void> {
  const { gateway, contract } = await getContract();
  try {
    await contract.submitTransaction(
      "IssueCertificate",
      record.certId,
      record.nim,
      record.name,
      record.majority,
      record.program,
      record.cid,
      record.hash,
      record.status,
      record.issuedAt
    );
  } finally {
    gateway.disconnect();
  }
}

/**
 * Take a certificate from Fabric.
 * If there isn't ⇒ return null.
 * another error ⇒ throw an error.
 */
export async function getCertificateFromFabric(
  certId: string
): Promise<CertificateRecord | null> {
  const { gateway, contract } = await getContract();
  try {
    const resultBytes = await contract.evaluateTransaction(
      "ReadCertificate",
      certId
    );
    if (!resultBytes || resultBytes.length === 0) {
      return null;
    }
    const json = resultBytes.toString("utf8");
    const data = JSON.parse(json) as CertificateRecord;
    return data;
  } catch (err: any) {
    if (
      typeof err.message === "string" &&
      err.message.includes("does not exist")
    ) {
      return null;
    }
    throw err;
  } finally {
    gateway.disconnect();
  }
}

/**
 * Take all certificate from Fabric.
 */
export async function getCertificatesFromFabric(): Promise<
  CertificateRecord[]
> {
  const { gateway, contract } = await getContract();
  try {
    const resultBytes = await contract.evaluateTransaction(
      "GetAllCertificates"
    );
    const text = resultBytes.toString("utf8").trim();
    if (!text) {
      return [];
    }
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed as CertificateRecord[];
    }
    throw new Error("Unexpected GetAllCertificates payload from Fabric");
  } finally {
    gateway.disconnect();
  }
}
