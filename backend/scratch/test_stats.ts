import dotenv from "dotenv";
dotenv.config();
import { db } from "../src/config/db";
import { checkFabricReady } from "../src/fabric/client";
import axios from "axios";

async function testAll() {
  console.log("=== Testing DB ===");
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("DB: ONLINE");
  } catch (e: any) {
    console.log("DB: OFFLINE -", e.message);
  }

  console.log("=== Testing IPFS ===");
  const ipfsApi = process.env.IPFS_API || "http://127.0.0.1:5001";
  try {
    const res = await axios.get(`${ipfsApi}/api/v0/version`, { timeout: 2000 });
    console.log("IPFS local: ONLINE, status:", res.status);
  } catch (e: any) {
    console.log("IPFS local: OFFLINE -", e.message);
  }

  if (process.env.PINATA_JWT) {
    try {
      const pinataRes = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
        headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
        timeout: 3000,
      });
      console.log("Pinata: ONLINE, status:", pinataRes.status);
    } catch (e: any) {
      console.log("Pinata: OFFLINE -", e.message);
    }
  }

  console.log("=== Testing Fabric ===");
  console.log("FABRIC_ENABLED:", process.env.FABRIC_ENABLED);
  try {
    const ready = await checkFabricReady("admin", "admin");
    console.log("Fabric: ONLINE, ready:", ready);
  } catch (e: any) {
    console.log("Fabric: OFFLINE -", e.message);
  }

  process.exit(0);
}

testAll();
