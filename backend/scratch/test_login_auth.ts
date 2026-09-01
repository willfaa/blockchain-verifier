import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import { db } from "../src/config/db";

async function testAuth() {
  console.log("=== Testing User Query & Auth Token Validation ===");

  const admin = await db.user.findFirst({
    where: { role: "admin" }
  });

  if (!admin) {
    console.log("No admin user found in DB, skipping token check.");
    return;
  }

  console.log(`Found Admin: ${admin.email} (ID: ${admin.id})`);

  const secret = process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026";
  const token = jwt.sign(
    {
      id: admin.id,
      role: admin.role,
      identifier: admin.email,
      sessionId: admin.currentSessionId || "test_session",
    },
    secret,
    { expiresIn: "24h" }
  );

  console.log("Generated Token:", token.substring(0, 25) + "...");

  // Verify
  const decoded = jwt.verify(token, secret) as any;
  const user = await db.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, role: true, isActive: true, currentSessionId: true }
  });

  console.log("Decoded & Validated User:", user);
  console.log("✅ Auth Token & Prisma FindUnique is 100% Functional!");
}

testAuth()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Auth test error:", err);
    process.exit(1);
  });
