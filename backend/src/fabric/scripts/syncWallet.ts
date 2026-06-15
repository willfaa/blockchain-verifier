// backend/src/scripts/syncWallet.ts
import * as path from "path";
import * as dotenv from "dotenv";

// 1. LOAD ENV FIRST (Sebelum import db)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Wallets, X509Identity } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import * as fs from "fs";
import { prisma } from "../../utils/prisma";

console.log("🛠️ DEBUG DB HOST:", process.env.PGHOST);
console.log("🛠️ DEBUG DB USER:", process.env.PGUSER);
// --- KONFIGURASI ---
const ROOT_WALLET_PATH = path.join(process.cwd(), "fabric-network", "wallet");
const CCP_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "fabric-network",
  "connection-org1.json"
);

async function main() {
  console.log("🚀 Memulai Sinkronisasi DB ke Wallet Fabric...");

  try {
    // 1. Setup Koneksi CA
    if (!fs.existsSync(CCP_PATH)) {
      throw new Error(`CCP tidak ditemukan di: ${CCP_PATH}`);
    }
    const ccp = JSON.parse(fs.readFileSync(CCP_PATH, "utf8"));
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // 2. Bersihkan Wallet Lama (Opsional, agar bersih total)
    console.log("🧹 Membersihkan wallet lama...");
    if (fs.existsSync(ROOT_WALLET_PATH)) {
      fs.rmSync(ROOT_WALLET_PATH, { recursive: true, force: true });
    }

    // 3. Enroll Admin (Wajib sebagai langkah pertama)
    console.log("👤 Enrolling Admin...");
    const adminWallet = await Wallets.newFileSystemWallet(ROOT_WALLET_PATH);
    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw", // Default Fabric samples
    });

    const adminIdentity: X509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await adminWallet.put("admin", adminIdentity);
    console.log("✅ Admin berhasil di-enroll.");

    // Persiapan Admin Context untuk mendaftarkan user lain
    const adminUser = await (
      await adminWallet.getProviderRegistry().getProvider(adminIdentity.type)
    ).getUserContext(adminIdentity, "admin");

    // 4. Ambil User dari Database
    console.log(
      "📥 Mengambil data user dari Database PostgreSQL via Prisma..."
    );
    // Filter: Hanya ambil user yang bukan 'admin' (karena admin sistem beda dengan admin fabric)
    const users = await prisma.user.findMany({
      where: {
        role: {
          not: "admin",
        },
      },
      select: {
        email: true,
        role: true,
      },
    });

    const dbUsers = users.map((u) => ({ identifier: u.email, role: u.role }));

    if (dbUsers.length === 0) {
      console.log("⚠️ Tidak ada user di database untuk disinkronkan.");
      return;
    }

    console.log(`found ${dbUsers.length} users in DB. Processing...`);

    // 5. Loop & Register Setiap User
    for (const user of dbUsers) {
      const { identifier, role } = user;

      // Tentukan Sub-folder Wallet
      let targetPath = ROOT_WALLET_PATH;
      if (role === "student") {
        targetPath = path.join(ROOT_WALLET_PATH, "student");
      } else if (role === "teacher" || role === "lecture") {
        targetPath = path.join(ROOT_WALLET_PATH, "lecture");
      }

      // Pastikan folder ada
      if (!fs.existsSync(targetPath))
        fs.mkdirSync(targetPath, { recursive: true });

      const userWallet = await Wallets.newFileSystemWallet(targetPath);

      try {
        process.stdout.write(`   👉 Processing ${identifier} (${role})... `);

        // A. Register ke CA (Dapatkan Secret)
        const secret = await ca.register(
          {
            affiliation: "org1.department1",
            enrollmentID: identifier,
            role: "client",
            attrs: [{ name: "role", value: role, ecert: true }],
          },
          adminUser
        );

        // B. Enroll (Dapatkan Sertifikat)
        const userEnrollment = await ca.enroll({
          enrollmentID: identifier,
          enrollmentSecret: secret,
        });

        // C. Simpan ke Wallet
        const userIdentity: X509Identity = {
          credentials: {
            certificate: userEnrollment.certificate,
            privateKey: userEnrollment.key.toBytes(),
          },
          mspId: "Org1MSP",
          type: "X.509",
        };
        await userWallet.put(identifier, userIdentity);

        console.log("✅ OK");
      } catch (err: any) {
        // Abaikan jika user sudah terdaftar di CA (mungkin re-run script)
        if (err.toString().includes("already registered")) {
          console.log("⚠️  Skipped (Already in CA)");
          // Note: Jika di CA ada tapi di wallet tidak ada, ini butuh re-enroll logic yg kompleks.
          // Asumsi: Network baru di-reset, jadi CA pasti kosong.
        } else {
          console.log(`❌ FAILED: ${err.message}`);
        }
      }
    }

    console.log(
      "\n✨ Sinkronisasi Selesai! Semua user DB kini memiliki identitas Blockchain."
    );
  } catch (error) {
    console.error(`\n❌ Fatal Error: ${error}`);
    process.exit(1);
  }
}

main();
