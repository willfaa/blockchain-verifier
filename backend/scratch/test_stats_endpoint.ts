import dotenv from "dotenv";
dotenv.config();
import { db } from "../src/config/db";
import jwt from "jsonwebtoken";
import axios from "axios";

async function main() {
  const admin = await db.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.log("No admin found in DB");
    return;
  }
  const token = jwt.sign(
    {
      id: admin.id,
      role: admin.role,
      identifier: admin.email,
      sessionId: admin.currentSessionId || undefined,
    },
    process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026",
    { expiresIn: "24h" }
  );

  console.log("Found Admin:", admin.email);
  try {
    const res = await axios.get("http://localhost:4000/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "69420",
      },
    });
    console.log("Stats result:", JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error("Axios error:", err.message, err.response?.status, err.response?.data);
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
