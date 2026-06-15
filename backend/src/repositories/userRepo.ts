import { db } from "../config/db";
import bcrypt from "bcryptjs";

// Kita gunakan PrismaClient global atau buat instance baru
const prisma = db;

// --- REGISTER USER ---
export const registerUser = async (data: any) => {
  const { name, email, password, role, studentId, nip, majority, program } = data;

  // 1. Hash Password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 2. Validasi Unik (Manual Check untuk error message yang jelas)
  // Cek Email
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new Error(`Email ${email} already registered`);

  // Cek Student ID
  if (role === "student" && studentId) {
    const existingStudent = await prisma.user.findUnique({ where: { studentId } });
    if (existingStudent) throw new Error(`Student ID ${studentId} already registered`);
  }

  // Cek NIP (Teacher)
  if (role === "teacher" && nip) {
    const existingNip = await prisma.user.findUnique({ where: { nip } });
    if (existingNip) throw new Error(`NIP ${nip} already registered`);
  }

  // 3. Simpan ke Database
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email, // This is now the Institutional Email
        personalEmail: data.personalEmail || null, // Store original input
        password: hashedPassword,
        role,
        // Field Nullable
        studentId: role === "student" ? studentId : null,
        nip: role === "teacher" ? nip : null,
        majority,
        studyProgram: program || data.studyProgram,

        // DEVELOPMENT OVERRIDE:
        isVerified: true, // Auto-verify new users
        isActive: true,
        isApproved: false, // Require Admin Approval explicitly
      } as any,
    });

    return newUser;
  } catch (err: any) {
    throw new Error("Registration failed: " + err.message);
  }
};

// --- LOGIN USER (Smart Login) ---
export const loginUser = async (
  identifier: string,
  password: string,
  role: string,
) => {
  // Logic Pintar: Cari user di mana Role cocok DAN (Email=ID ATAU StudentID=ID ATAU NIP=ID)
  const user = await prisma.user.findFirst({
    where: {
      role: role,
      OR: [{ email: identifier }, { studentId: identifier }, { nip: identifier }],
    },
  });

  if (!user) return null;

  // Cek Password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return user;
};

// --- HELPER LAIN ---

export const getUserByStudentId = async (studentId: string) => {
  return prisma.user.findUnique({
    where: { studentId },
  });
};

// --- COURSE & ENROLLMENT ---

export const enrollCourse = async (userId: string, courseId: string) => {
  // Cek apakah sudah enroll
  const existing = await prisma.enrollment.findFirst({
    where: { userId, courseId },
  });

  if (existing) return existing;

  // Create enrollment baru
  return prisma.enrollment.create({
    data: {
      userId,
      courseId,
      progress: 0,
      // enrolledAt otomatis default(now()) di schema biasanya
    },
  });
};

export const getEnrollments = async (userId: string) => {
  return prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: true, // Include data course biar frontend bisa tampilkan Judul/Deskripsi
    },
  });
};
