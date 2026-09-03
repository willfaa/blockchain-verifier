// backend/src/scripts/resetCertificates.ts
import * as dotenv from "dotenv";
import * as path from "path";
import axios from "axios";
import { db } from "../config/db";

// 1. Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function unpinAllFromPinata() {
  const jwt = process.env.PINATA_JWT?.replace(/^["']|["']$/g, "").trim();
  const apiKey = process.env.PINATA_API_KEY?.replace(/^["']|["']$/g, "").trim();
  const apiSecret = process.env.PINATA_API_SECRET?.replace(/^["']|["']$/g, "").trim();

  if (!jwt && (!apiKey || !apiSecret)) {
    console.log("ℹ️ Pinata credentials not found. Skipping IPFS unpinning.");
    return { unpinnedCount: 0, failedCount: 0 };
  }

  const headers: Record<string, string> = {};
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  } else if (apiKey && apiSecret) {
    headers["pinata_api_key"] = apiKey;
    headers["pinata_secret_api_key"] = apiSecret;
  }

  console.log("🔍 Scanning Pinata Cloud for pinned certificate files/metadata...");
  let unpinnedCount = 0;
  let failedCount = 0;

  try {
    const listRes = await axios.get("https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100", {
      headers,
      timeout: 10000,
    });

    const rows = listRes.data?.rows || [];
    console.log(`📌 Found ${rows.length} pinned item(s) on Pinata.`);

    for (const row of rows) {
      const ipfsPinHash = row.ipfs_pin_hash;
      const fileName = row.metadata?.name || ipfsPinHash;
      try {
        await axios.delete(`https://api.pinata.cloud/pinning/unpin/${ipfsPinHash}`, {
          headers,
          timeout: 8000,
        });
        console.log(`   🗑️ Unpinned from Pinata: ${fileName} (${ipfsPinHash})`);
        unpinnedCount++;
      } catch (unpinErr: any) {
        console.warn(`   ⚠️ Failed to unpin ${ipfsPinHash}:`, unpinErr.message);
        failedCount++;
      }
    }
  } catch (err: any) {
    console.error("   ❌ Failed to list/unpin from Pinata:", err.message);
  }

  return { unpinnedCount, failedCount };
}

async function main() {
  console.log("=================================================================");
  console.log("🚀 MEMULAI PROSES RESET TOTAL SERTIFIKAT (DATABASE + IPFS PINATA)");
  console.log("=================================================================\n");

  try {
    // 1. IPFS Pinata Unpin
    console.log("1. Menghapus data sertifikat di Pinata IPFS Cloud...");
    const { unpinnedCount, failedCount } = await unpinAllFromPinata();
    console.log(`   ✅ Selesai unpin Pinata: ${unpinnedCount} berhasil, ${failedCount} gagal/dilewati.\n`);

    // 2. Database Certificate Deletion
    console.log("2. Menghapus riwayat koreksi sertifikat di database...");
    const deletedCorrections = await db.certificateCorrectionRequest.deleteMany({});
    console.log(`   ✅ Berhasil menghapus ${deletedCorrections.count} data pengajuan koreksi.\n`);

    console.log("3. Menghapus seluruh sertifikat di tabel database...");
    const deletedCerts = await db.certificate.deleteMany({});
    console.log(`   ✅ Berhasil menghapus ${deletedCerts.count} data sertifikat.\n`);

    // 3. Reset Enrollment Status
    console.log("4. Me-reset status klaim sertifikat pada Enrollment kelas...");
    const updatedEnrollments = await db.enrollment.updateMany({
      data: {
        certificateId: null,
        completedAt: null,
      },
    });
    console.log(`   ✅ Berhasil me-reset ${updatedEnrollments.count} status kelulusan/klaim di kelas.\n`);

    console.log("=================================================================");
    console.log("🎉 RESET TOTAL SERTIFIKAT SELESAI DENGAN SUKSES!");
    console.log("   • Akun User (Admin, Guru, Siswa) & Kelas TETAP AMAN.");
    console.log("   • Semua riwayat sertifikat di DB & Pinata telah dibersihkan.");
    console.log("   • Siswa kini dapat menguji alur klaim sertifikat secara fresh.");
    console.log("=================================================================\n");
  } catch (error: any) {
    console.error("❌ Gagal melakukan reset sertifikat:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
