// backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. Hash Password
  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Create ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@chainnesa.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@chainnesa.com",
      password: passwordHash,
      role: "admin",
      isVerified: true,
      isActive: true,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // 3. Create TEACHER (Dosen)
  const teacher = await prisma.user.upsert({
    where: { email: "dosen@chainnesa.com" },
    update: {},
    create: {
      name: "Dr. Budi Santoso, M.Kom",
      email: "dosen@chainnesa.com",
      password: passwordHash,
      role: "teacher",
      isVerified: true,
      isActive: true,
      nip: "198001012025011001", // Field baru
      majority: "Teknik Informatika", // Field baru
      studyProgram: "S1 Sistem Informasi",
    },
  });
  console.log("✅ Teacher created:", teacher.email);

  // 4. Create STUDENT (Mahasiswa)
  const student = await prisma.user.upsert({
    where: { email: "mahasiswa@chainnesa.com" }, // Email unik
    update: {},
    create: {
      name: "Will Faa",
      email: "mahasiswa@chainnesa.com",
      password: passwordHash,
      role: "student",
      isVerified: true,
      isActive: true,
      nim: "18050974044", // Field baru
      majority: "Pendidikan TI",
      studyProgram: "S1 Pendidikan TI",
    },
  });
  console.log("✅ Student created:", student.email);

  // 5. Create COURSE (Contoh Kursus)
  const course = await prisma.course.upsert({
    where: { id: "demo-course-1" }, // ID statis biar tidak duplikat saat seed ulang
    update: {},
    create: {
      id: "demo-course-1",
      title: "Blockchain Fundamentals",
      description:
        "Belajar dasar-dasar blockchain dari nol hingga Hyperledger Fabric.",
      teacherId: teacher.id, // Relasi ke User (Dosen)
      isPublished: true,
    },
  });
  console.log("✅ Course created:", course.title);

  // 6. Create ENROLLMENT (Mahasiswa ambil kursus)
  // Cek dulu biar gak error unique constraint
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { userId: student.id, courseId: course.id },
  });

  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        userId: student.id, // Pakai userId (Schema baru)
        courseId: course.id,
        progress: 10,
      },
    });
    console.log("✅ Enrollment created");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
