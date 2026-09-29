import { db } from "../src/config/db";

async function main() {
  const certs = await db.certificate.findMany({
    select: {
      certId: true,
      status: true,
      blockchainSyncStatus: true,
      studentName: true,
    },
  });
  console.log("=== DB CERTIFICATES COUNT:", certs.length, "===");
  console.log(certs);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
