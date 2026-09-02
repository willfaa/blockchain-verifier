import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import https from "https";

async function testDetailed() {
  const jwt = (process.env.PINATA_JWT || "").replace(/^["']|["']$/g, "").trim();
  console.log("Testing with HTTPS Agent & 15s timeout...");
  
  const agent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: true,
  });

  try {
    const t0 = Date.now();
    const res = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "User-Agent": "ChainNesa-Verifier/1.0",
      },
      httpsAgent: agent,
      timeout: 15000,
    });
    console.log(`Success in ${Date.now() - t0}ms:`, res.status, res.data);
  } catch (err: any) {
    if (err.response) {
      console.error("HTTP Response Error:", err.response.status, err.response.data);
    } else {
      console.error("Connection / Network Error:", err.code, err.message);
    }
  }
}

testDetailed();
