import "dotenv/config";
import { db } from "../src/config/db"; // Import the configured instance
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting Seeding...");

  // 1. Hash Password
  const adminPassword = await bcrypt.hash("admin123", 10);

  // 2. Upsert Admin (Use 'db' instead of 'prisma')
  const admin = await db.user.upsert({
    where: { email: "admin@chainnesa.com" },
    update: {
      role: "admin", // Enforce lowercase 'admin' to match app logic
      isApproved: true,
      isVerified: true,
      isActive: true,
      password: adminPassword,
    },
    create: {
      email: "admin@chainnesa.com",
      name: "Admin Web",
      password: adminPassword,
      role: "admin", // Lowercase to match code convention found earlier
      isApproved: true,
      isVerified: true,
      isActive: true, // Recommended to set active
    },
  });

  console.log("Created Admin:", admin.name);
  console.log("✅ Seeding finished.");
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
