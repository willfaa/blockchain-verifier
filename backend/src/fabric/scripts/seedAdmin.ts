// backend/src/scripts/seedAdmin.ts
import { query } from "../../config/db";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seedAdmin() {
  const username = "superadmin"; // Identifier login
  const password = "adminpassword123"; // Password login
  const name = "System Administrator";

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Cek apakah admin sudah ada
    const check = await query("SELECT * FROM users WHERE identifier = $1", [
      username,
    ]);
    if (check.length > 0) {
      console.log("⚠️  Admin user already exists in DB.");
      return;
    }

    // Insert ke tabel users
    await query(
      `INSERT INTO users (identifier, role, name, password_hash)
       VALUES ($1, 'admin', $2, $3)`,
      [username, name, hash]
    );

    console.log(`✅ Admin seeded successfully!`);
    console.log(`👤 Identifier: ${username}`);
    console.log(`🔑 Password: ${password}`);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  }
}

seedAdmin();
