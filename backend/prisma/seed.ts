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

  // 3. Seed dynamic vocational school fields
  const vocationalData = [
    {
      bidang: "Teknologi Informasi",
      programs: [
        {
          name: "Pengembangan Perangkat Lunak dan Gim",
          concentrations: ["Rekayasa Perangkat Lunak", "Pengembangan Gim"],
        },
        {
          name: "Teknik Jaringan Komputer dan Telekomunikasi",
          concentrations: ["Teknik Komputer dan Jaringan"],
        },
      ],
    },
    {
      bidang: "Bisnis dan Manajemen",
      programs: [
        {
          name: "Akuntansi dan Keuangan Lembaga",
          concentrations: ["Akuntansi"],
        },
        {
          name: "Manajemen Perkantoran dan Layanan Bisnis",
          concentrations: ["Manajemen Perkantoran"],
        },
      ],
    },
    {
      bidang: "Seni dan Ekonomi Kreatif",
      programs: [
        {
          name: "Desain Komunikasi Visual",
          concentrations: ["Desain Komunikasi Visual", "Animasi"],
        },
      ],
    },
  ];

  for (const item of vocationalData) {
    const bKeahlian = await db.bidangKeahlian.upsert({
      where: { name: item.bidang },
      update: {},
      create: { name: item.bidang },
    });

    for (const prog of item.programs) {
      const pKeahlian = await db.programKeahlian.upsert({
        where: { name: prog.name },
        update: { bidangKeahlianId: bKeahlian.id },
        create: { name: prog.name, bidangKeahlianId: bKeahlian.id },
      });

      for (const conc of prog.concentrations) {
        await db.konsentrasiKeahlian.upsert({
          where: { name: conc },
          update: { programKeahlianId: pKeahlian.id },
          create: { name: conc, programKeahlianId: pKeahlian.id },
        });
      }
    }
  }

  console.log("🌱 Dynamic vocational fields seeded successfully.");
  console.log("✅ Seeding finished.");
}

main().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
