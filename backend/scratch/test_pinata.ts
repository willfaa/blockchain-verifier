import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

async function testPinata() {
  const jwt = (process.env.PINATA_JWT || "").replace(/^["']|["']$/g, "").trim();
  console.log("Testing Pinata JWT (length:", jwt.length, ")...");
  try {
    const res = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      timeout: 5000,
    });
    console.log("Pinata Auth Response:", res.status, res.data);
  } catch (err: any) {
    if (err.response) {
      console.error("Pinata Error:", err.response.status, err.response.data);
    } else {
      console.error("Pinata Network Error:", err.message);
    }
  }
}

testPinata();
