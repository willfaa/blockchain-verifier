// @ts-nocheck
// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  registerUser,
  loginUser,
  getUserByStudentId,
} from "../repositories/userRepo";
import { Prisma } from "../generated/prisma";
import bcrypt from "bcryptjs";
import { db } from "../config/db";
import { v4 as uuidv4 } from "uuid";

const prisma = db;

// 1. REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log("Registering user:", payload.role, payload.name);

    // MAPPING: If frontend sends 'nim' or 'nisn', map it to 'studentId'
    if (payload.nim && !payload.studentId) {
      payload.studentId = payload.nim;
    }
    if (payload.nisn && !payload.studentId) {
      payload.studentId = payload.nisn;
    }

    // SAFETY NET: Validation with Indonesian field aliases
    if (!payload.majority && (payload.konsentrasiKeahlian || payload.majorityKeahlian)) {
      payload.majority = payload.konsentrasiKeahlian || payload.majorityKeahlian;
    }
    if (!payload.studyProgram && (payload.programKeahlian || payload.program)) {
      payload.studyProgram = payload.programKeahlian || payload.program;
    }
    if (!payload.faculty && (payload.bidangKeahlian || payload.bidang)) {
      payload.faculty = payload.bidangKeahlian || payload.bidang;
    }

    if (!payload.majority || !payload.studyProgram) {
      return res
        .status(400)
        .json({ error: "Academic data (Bidang, Program, atau Konsentrasi Keahlian) is incomplete." });
    }

    const user = await registerUser({
      ...payload,
      role: String(payload.role || "student").toLowerCase(),
      email: payload.email,
      personalEmail: payload.personalEmail,
    });

    res.json({
      ok: true,
      user: {
        ...user,
      },
      message: `Registration Successful! Please wait for Admin approval.`,
    });
  } catch (err: any) {
    console.error("Register error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// 2. LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    // Validasi input
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Identifier and password are required" });
    }

    // Smart Search: Cek Email OR Student ID OR NIP
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { studentId: identifier }, { nip: identifier }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Cek Password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // STRICT ROLE CHECK (Case-insensitive)
    // Enforce portal isolation: Students, Teachers, and Admins must use their respective portals
    const normalizedUserRole = String(user.role || "").toLowerCase();
    if (
      req.body.role &&
      normalizedUserRole !== String(req.body.role).toLowerCase()
    ) {
      return res.status(403).json({
        error: `Access Denied: You cannot login as ${req.body.role} with this account. Please use the appropriate login portal.`,
      });
    }

    // Cek Status Aktif (Ban System)
    if ((user as any).isActive === false) {
      return res
        .status(403)
        .json({ error: "Your account has been deactivated. Contact Admin." });
    }

    // Cek Status Approval (New Feature)
    if ((user as any).isApproved === false) {
      return res.status(403).json({
        error: "Account pending approval. Please wait for Admin confirmation.",
      });
    }

    // --- GENERATE SESSION ID ---
    const currentSessionId = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: { currentSessionId },
    });

    // --- GENERATE TOKEN ---
    const uniqueId = user.email || user.studentId || user.nip;

    const token = jwt.sign(
      {
        id: user.id,
        role: normalizedUserRole,
        identifier: uniqueId,
        sessionId: currentSessionId,
      },
      process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026",
      { expiresIn: "24h" },
    );

    // Exclude password hash before returning
    const { password: _, ...safeUser } = user;

    // Kirim Response
    res.json({
      ok: true,
      user: {
        ...safeUser,
        role: normalizedUserRole,
        currentSessionId,
        token: token,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed internal error" });
  }
};

// 3. GET STUDENT BY STUDENT ID (Untuk Autocomplete di Sertifikat)
export const findStudentByStudentId = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const student = await getUserByStudentId(studentId);

    if (!student) {
      return res.status(404).json({ error: "User is not found" });
    }
    res.json({ ok: true, student });
  } catch (err: any) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
};

// 4. GET CURRENT USER (Protected)
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: No User ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        personalEmail: true,
        role: true,
        avatar: true,
        bio: true,
        studentId: true,
        nip: true,
        majority: true,
        studyProgram: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const normalizedUser = {
      ...user,
      role: String(user.role || "").toLowerCase(),
    };

    res.json({ ok: true, data: normalizedUser, user: normalizedUser });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
