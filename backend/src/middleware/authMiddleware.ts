import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db";

const prisma = db;

interface UserPayload {
  id: string;
  identifier: string;
  role: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026";

function decodeTokenSafely(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

// In-memory session cache to avoid DB saturation under heavy traffic (e.g. exams)
const sessionCache = new Map<string, { currentSessionId: string | null; isActive: boolean; expiresAt: number }>();

async function getCachedUserSession(userId: string) {
  const now = Date.now();
  const cached = sessionCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentSessionId: true, isActive: true },
  });

  if (user) {
    sessionCache.set(userId, {
      currentSessionId: user.currentSessionId,
      isActive: user.isActive,
      expiresAt: now + 30000, // 30s TTL
    });
  }
  return user;
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied. Token missing." });
  }

  try {
    const decoded = decodeTokenSafely(token);

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: "Access Denied. Invalid token format." });
    }

    // Validate active session with 30s cache
    const user = await getCachedUserSession(userId);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ error: "Your account has been deactivated. Contact Admin." });
    }

    if (decoded.sessionId && user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      return res.status(401).json({
        error:
          "You have been logged out because another login session was started.",
        code: "SESSION_OVERWRITTEN",
      });
    }

    req.user = {
      id: userId,
      role: decoded.role,
      identifier: decoded.identifier || decoded.email || decoded.studentId || userId,
      sessionId: decoded.sessionId,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or Expired Token.", code: "TOKEN_EXPIRED" });
  }
};

export const optionalVerifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = decodeTokenSafely(token);
    const userId = decoded.id || decoded.userId;
    if (!userId) return next();

    const user = await getCachedUserSession(userId);

    if (user && user.isActive) {
      req.user = {
        id: userId,
        role: decoded.role,
        identifier: decoded.identifier || decoded.email || decoded.studentId || userId,
        sessionId: decoded.sessionId,
      };
    }
    next();
  } catch (error) {
    next();
  }
};

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== "admin") {
    // STOP EXECUTION
    return res.status(403).json({ error: "Access Denied. Admin only." });
  }
  next();
};

export const verifyTeacher = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== "teacher" && role !== "admin") {
    return res.status(403).json({ error: "Access Denied. Teachers only." });
  }
  next();
};

export const verifyStudent = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== "student" && role !== "admin") {
    return res.status(403).json({ error: "Access Denied. Students only." });
  }
  next();
};

export const verifyIssuer = (
  req: Request,
  res: Response,
  next: NextFunction,
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

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.toLowerCase();

    // Safety check
    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized: No role found." });
    }

    const rolesLower = allowedRoles.map((r) => r.toLowerCase());
    if (!rolesLower.includes(userRole)) {
      return res.status(403).json({
        error: `Access Denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};
