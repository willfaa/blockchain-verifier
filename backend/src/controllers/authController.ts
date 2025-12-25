// backend/src/controllers/authController.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  registerUser,
  loginUser,
  getUserByNim,
} from "../repositories/userRepo";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 1. REGISTER
// 1. REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log("Registering user:", payload.role, payload.name);

    // Front-end now generates the ID (payload.email) and sends recovery (payload.personalEmail)
    // We trust valid institutional emails end with @chainnesa.com

    // SAFETY NET: Validation
    if (!payload.majority || !payload.studyProgram) {
      return res
        .status(400)
        .json({ error: "Academic data (Majority/Program) is incomplete." });
    }

    // Ensure data flow:
    // payload.email -> Institutional Email
    // payload.personalEmail -> Personal Email

    const user = await registerUser({
      ...payload,
      // Ensure we map correctly just in case, though frontend sends matching keys
      email: payload.email,
      personalEmail: payload.personalEmail,
    });

    // --- GENERATE TOKEN (Auto Login) ---
    const uniqueId = user.email || user.nim || user.nip;
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        identifier: uniqueId,
      },
      process.env.JWT_SECRET || "rahasia_default",
      { expiresIn: "24h" }
    );

    res.json({
      ok: true,
      user: {
        ...user,
        token, // Add token to response
      },
      message: `Registration Successful!`,
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

    // Smart Search: Cek Email OR NIM OR NIP
    // Note: We don't filter by role here to allow "Smart Auth".
    // If strict role check is needed, we can check user.role === req.body.role later,
    // but typically username/password is enough unique ID.
    // Let's assume unique identifier across system is enforcing uniqueness or just pick first.
    // Ideally Email/NIM/NIP are unique constraints.
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { nim: identifier }, { nip: identifier }],
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid credentials or User not found" });
    }

    // Cek Password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // STRICT ROLE CHECK
    // Prevent students from logging in via Teacher/Admin forms
    if (req.body.role && user.role !== req.body.role) {
      return res.status(403).json({
        error: `Access Denied: You are not a ${req.body.role}. Please switch to the ${user.role} login.`,
      });
    }

    // Cek Status Aktif (Ban System)
    if ((user as any).isActive === false) {
      return res
        .status(403)
        .json({ error: "Your account has been deactivated. Contact Admin." });
    }

    // --- GENERATE TOKEN ---
    // Logika fallback: cari identifier unik
    const uniqueId = user.email || user.nim || user.nip;

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        identifier: uniqueId,
      },
      process.env.JWT_SECRET || "rahasia_default",
      { expiresIn: "24h" }
    );

    // Kirim Response
    res.json({
      ok: true,
      user: {
        ...user,
        token: token,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed internal error" });
  }
};

// 3. GET STUDENT BY NIM (Untuk Autocomplete di Sertifikat)
export const findStudentByNim = async (req: Request, res: Response) => {
  try {
    const { nim } = req.params;
    const student = await getUserByNim(nim);

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
    // 1. Get ID from Token (middleware populates this)
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: No User ID" });
    }

    // 2. Find User in DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        personalEmail: true,
        role: true,
        avatar: true, // Needed for profile image
        bio: true,
        majority: true,
        studyProgram: true,
        isVerified: true,
      },
    });

    // 3. Handle Not Found
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    // 4. Success
    res.json({ ok: true, data: user, user }); // Return 'user' directly too for compatibility
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
