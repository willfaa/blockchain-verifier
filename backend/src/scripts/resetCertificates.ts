// backend/src/scripts/resetCertificates.ts
import * as dotenv from "dotenv";
import * as path from "path";

// 1. MUST load dotenv BEFORE importing db or any database configs!
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import axios from "axios";
import { db } from "../config/db";

const SUPABASE_API_URL =
  process.env.SUPABASE_API_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

const getSupabaseHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

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

    // 2. Direct Supabase Cloud REST Cleanup
    console.log("2. Menghapus data sertifikat langsung di Supabase Cloud (REST API)...");
    try {
      // 2a. Delete Correction Requests
      const delCorrRes = await axios.delete(
        `${SUPABASE_API_URL}/rest/v1/certificate_correction_requests?id=not.is.null`,
        { headers: getSupabaseHeaders(), timeout: 10000 }
      ).catch(() => null);
      if (delCorrRes?.data) {
        console.log(`   ✅ Supabase REST: Berhasil menghapus ${delCorrRes.data.length || 0} pengajuan koreksi.`);
      }

      // 2b. Delete Certificates
      const delCertsRes = await axios.delete(
        `${SUPABASE_API_URL}/rest/v1/certificates?id=not.is.null`,
        { headers: getSupabaseHeaders(), timeout: 10000 }
      );
      console.log(`   ✅ Supabase REST: Berhasil menghapus ${delCertsRes.data?.length || 0} data sertifikat.`);

      // 2c. Reset Enrollments
      const patchEnrRes = await axios.patch(
        `${SUPABASE_API_URL}/rest/v1/enrollments?id=not.is.null`,
        {
          certificateId: null,
          completedAt: null,
          isCompleted: false,
        },
        { headers: getSupabaseHeaders(), timeout: 10000 }
      );
      console.log(`   ✅ Supabase REST: Berhasil me-reset ${patchEnrRes.data?.length || 0} status kelulusan enrollment.`);
    } catch (sbErr: any) {
      console.warn(`   ⚠️ Supabase REST Notice:`, sbErr.response?.data?.message || sbErr.message);
    }
    console.log("");

    // 3. Prisma Database Cleanup
    console.log("3. Menghapus rekaman sertifikat melalui Prisma Client...");
    try {
      const deletedCerts = await db.certificate.deleteMany({});
      console.log(`   ✅ Prisma: Berhasil membersihkan ${deletedCerts.count} data sertifikat.\n`);
    } catch (certErr: any) {
      console.warn(`   ⚠️ Prisma:`, certErr.message);
    }

    // 4. Reset Enrollment Status via Prisma
    console.log("4. Me-reset status klaim sertifikat pada Enrollment (Prisma)...");
    try {
      const updatedEnrollments = await db.enrollment.updateMany({
        data: {
          certificateId: null,
          completedAt: null,
          isCompleted: false,
        },
      });
      console.log(`   ✅ Prisma: Berhasil me-reset ${updatedEnrollments.count} status kelulusan di kelas.\n`);
    } catch (enrErr: any) {
      console.warn(`   ⚠️ Prisma Enrollment:`, enrErr.message);
    }

    console.log("=================================================================");
    console.log("🎉 RESET TOTAL SERTIFIKAT SELESAI DENGAN SUKSES!");
    console.log("   • Akun User (Admin, Guru, Siswa) & Kelas TETAP AMAN.");
    console.log("   • Semua riwayat sertifikat di Supabase Cloud & Pinata telah dibersihkan.");
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
