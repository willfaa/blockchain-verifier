// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Interface untuk data yang disimpan dalam Token
interface UserPayload {
  id: string;
  identifier: string;
  role: string; // 'admin', 'student', 'teacher'
}

// Extend Request Express agar bisa membaca req.user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Ambil token dari Header (Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Ambil kata kedua setelah 'Bearer'

  if (!token) {
    return res
      .status(401)
      .json({ error: "Akses Ditolak. Token tidak ditemukan." });
  }

  try {
    // 2. Verifikasi Tanda Tangan Token
    const secret =
      process.env.JWT_SECRET || "rahasia_default_jangan_dipakai_prod";
    const decoded = jwt.verify(token, secret) as UserPayload;

    // 3. Simpan data user ke request agar bisa dipakai di Controller
    req.user = decoded;

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Token Tidak Valid atau Kadaluarsa." });
  }
};

// Middleware Khusus Admin (Untuk Revoke atau tugas berat lain)
export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Akses Ditolak. Hanya Admin yang boleh melakukan ini." });
  }
  next();
};

// Middleware Baru: Mengizinkan Teacher DAN Admin untuk Issue
export const verifyIssuer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const role = req.user?.role?.toLowerCase();
  // Cek apakah role adalah teacher ATAU admin
  if (role !== "teacher" && role !== "admin") {
    console.warn(`Permission Denied: User role '${role}' is not teacher/admin`);
    return res.status(403).json({
      error:
        "Akses Ditolak. Hanya Dosen atau Admin yang boleh menerbitkan sertifikat.",
    });
  }
  next();
};

// Middleware Flexible Issuer Type
export const verifyIssuerType = (allowedRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role?.toLowerCase();
    const targetedRole = allowedRole.toLowerCase();

    if (role !== targetedRole && role !== "admin") {
      return res.status(403).json({
        error: `Access Denied. Only ${targetedRole} or Admin allowed.`,
      });
    }
    next();
  };
};
