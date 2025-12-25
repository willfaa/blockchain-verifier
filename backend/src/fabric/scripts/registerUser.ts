// backend/src/fabric/scripts/registerUser.ts
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wallets, X509Identity } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import * as path from "path";
import * as fs from "fs";
import "dotenv/config";

// Usage: npx ts-node src/fabric/scripts/registerUser.ts <username> <role>
const USER_ID = process.argv[2];
const ROLE = process.argv[3] || "student"; // Default: student

if (!USER_ID) {
  console.log(
    "❌ Usage: npx ts-node src/fabric/scripts/registerUser.ts <Username> <Role>"
  );
  console.log(
    "   Example: npx ts-node src/fabric/scripts/registerUser.ts 1234 teacher"
  );
  process.exit(1);
}

async function main() {
  try {
    // 1. Setup Konfigurasi Koneksi (CCP)
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // 2. Setup CA Client
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // 3. Define Wallet Paths
    // Root wallet (where admin lives) -> backend/fabric-network/wallet
    const rootWalletPath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "fabric-network",
      "wallet"
    );

    // Target wallet (where user will live)
    let targetWalletPath = rootWalletPath;
    if (ROLE === "student") {
      targetWalletPath = path.join(rootWalletPath, "student");
    } else if (ROLE === "teacher" || ROLE === "lecture") {
      targetWalletPath = path.join(rootWalletPath, "lecture");
    }

    // Ensure directory exists
    if (!fs.existsSync(targetWalletPath)) {
      fs.mkdirSync(targetWalletPath, { recursive: true });
    }

    console.log(
      `📂 Backend Root: ${path.resolve(__dirname, "..", "..", "..")}`
    );
    console.log(`📂 Wallet Root: ${rootWalletPath}`);
    console.log(`📂 Target Wallet: ${targetWalletPath}`);

    const wallet = await Wallets.newFileSystemWallet(targetWalletPath);

    // 4. Check if user already exists
    const userIdentity = await wallet.get(USER_ID);
    if (userIdentity) {
      console.log(`⚠️  Identity "${USER_ID}" already exists in wallet.`);
      return;
    }

    // 5. Get Admin from Root Wallet
    const adminWallet = await Wallets.newFileSystemWallet(rootWalletPath);
    const adminIdentity = await adminWallet.get("admin");
    if (!adminIdentity) {
      console.log(
        '❌ Error: Identity "admin" not found in root wallet. Run enrollAdmin.ts first.'
      );
      return;
    }

    // 6. Build Admin User Context
    const provider = adminWallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    // 7. Register User
    console.log(`⏳ Registering user "${USER_ID}" (Role: ${ROLE})...`);
    let secret = "";
    try {
      secret = await ca.register(
        {
          affiliation: "org1.department1",
          enrollmentID: USER_ID,
          role: "client",
          attrs: [{ name: "role", value: ROLE, ecert: true }],
        },
        adminUser
      );
      console.log(`✅ Registration successful. Secret: ${secret}`);
    } catch (err: any) {
      if (err.toString().includes("already registered")) {
        console.log(
          "⚠️  User already registered at CA. Attempting re-enrollment..."
        );
        // If already registered, we try to enroll without a secret (unlikely to work without re-auth, but standard fallback)
        // Ideally we would need the secret or an admin to re-register.
        // For development, we assume if local wallet is empty but CA has it, maybe we can re-enroll?
        // Actually Fabric CA requires enrollment secret. If we lost it, we might need to re-register with new secret?
        // But you can't re-register same ID.
        // We will proceed and see if enroll fails.
      } else {
        throw err;
      }
    }

    // 8. Enroll User
    console.log(`⏳ Enrolling "${USER_ID}"...`);
    // If we have a secret from register, use it. If not, try empty or default (will likely fail if auth required)
    // Note: If previous secret is lost, admin needs to re-register with --max-enrollments > 1 or similar ops.
    // Here we use secret if available.
    const enrollment = await ca.enroll({
      enrollmentID: USER_ID,
      enrollmentSecret: secret || USER_ID, // Use USER_ID as fallback secret (common in test-network samples)
    });

    // 9. Import to Wallet
    const x509Identity: X509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await wallet.put(USER_ID, x509Identity);
    console.log(
      `✅ SUCCESS: Identity "${USER_ID}" imported to ${targetWalletPath}`
    );
  } catch (error) {
    console.error(`❌ Failed: ${error}`);
    process.exit(1);
  }
}

main();
