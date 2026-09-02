import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
import axios from "axios";

async function test() {
  const jwt = (process.env.PINATA_JWT || "").replace(/^["']|["']$/g, "").trim();
  console.log("Testing with ipv4first...");
  try {
    const res = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      timeout: 10000,
    });
    console.log("PINATA AUTH SUCCESS:", res.status, res.data);
  } catch (e: any) {
    console.error("PINATA AUTH FAILED:", e.message, e.response?.data);
  }
}

test();
