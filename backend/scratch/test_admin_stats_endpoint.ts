import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import jwt from "jsonwebtoken";
import { db } from "../src/config/db";

async function testEndpoint() {
  console.log("=== Testing /api/admin/stats Endpoint directly ===");

  const admin = await db.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.log("No admin found");
    return;
  }

  const secret = process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026";
  const token = jwt.sign(
    {
      id: admin.id,
      role: admin.role,
      identifier: admin.email,
      sessionId: admin.currentSessionId,
    },
    secret,
    { expiresIn: "24h" }
  );

  try {
    const res = await axios.get("http://localhost:4000/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.error("HTTP Error:", err.response.status, err.response.data);
    } else {
      console.error("Connection Error (is backend running?):", err.message);
    }
  }
}

testEndpoint()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
