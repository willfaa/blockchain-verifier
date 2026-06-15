import { Request, Response } from "express";
import { db } from "../config/db";
import bcrypt from "bcryptjs";

/**
 * SAFETY GUARD: Ensures only one response is sent per request.
 * Prevents "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
 */
const safeResponse = (res: Response, status: number, data: any) => {
  if (res.headersSent) {
    console.warn(
      "[SafeResponse] Attempted to send headers twice. Execution blocked."
    );
    return;
  }
  return res.status(status).json(data);
};

// 1. Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      pendingTeachers,
      totalCourses,
      totalCertificates,
      recentActivity,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          role: { equals: "TEACHER", mode: "insensitive" },
          isVerified: false,
        },
      }),
      db.course.count(),
      db.certificate.count(),
      db.certificate.findMany({
        take: 5,
        orderBy: { issuedAt: "desc" },
        select: {
          id: true,
          studentName: true,
          hash: true,
          issuedAt: true,
          program: true,
        },
      }),
    ]);

    return safeResponse(res, 200, {
      ok: true,
      stats: {
        totalUsers,
        pendingTeachers,
        totalCertificates,
        totalCourses,
      },
      system: {
        dbPort: process.env.DB_PORT || "5432",
        ipfsApi: process.env.IPFS_API || "http://127.0.0.1:5001",
        ipfsGateway: process.env.IPFS_GATEWAY || "http://127.0.0.1:8081",
        fabricEnabled: process.env.FABRIC_ENABLED === "true",
        uptime: Math.floor(process.uptime()),
      },
      recentActivity,
    });
  } catch (error: any) {
    console.error("[DashboardStats Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch dashboard stats" });
  }
};

// 2. Pending Users
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        majority: true,
        studyProgram: true,
        avatar: true,
      },
    });

    return safeResponse(res, 200, { ok: true, data: users });
  } catch (error: any) {
    console.error("[PendingUsers Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch pending users" });
  }
};

// 3. Active Users (STRICT ALIGNMENT VERSION)
export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    console.log(">>> [ADMIN] getActiveUsers - Query Params:", req.query);

    const { role, search, majority, program, sortBy, sortOrder } = req.query;
    const whereClause: any = { isApproved: true };

    // --- ROLE FILTERING ---
    if (role && typeof role === "string") {
      const normalizedRole = role.toUpperCase();
      // If "ALL", we don't apply a role filter
      if (normalizedRole !== "ALL") {
        // Map Plural to Singular
        const roleMap: Record<string, string> = {
          ADMINS: "ADMIN",
          STUDENTS: "STUDENT",
          TEACHERS: "TEACHER",
        };
        const mappedRole = roleMap[normalizedRole] || normalizedRole;

        // Since schema.prisma defines role as a String (not Enum), we can use insensitive matching
        whereClause.role = {
          equals: mappedRole,
          mode: "insensitive",
        };
      }
    }

    // --- OTHER FILTERS ---
    if (majority && majority !== "All Majors")
      whereClause.majority = String(majority);
    if (program && program !== "All Programs")
      whereClause.studyProgram = String(program);

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
      ];
    }

    // --- SORTING (Fix Prisma error: Unknown argument 'status') ---
    let sortField = String(sortBy || "createdAt");

    // Map Frontend names to Prisma Schema names
    if (sortField === "status") sortField = "isActive";
    if (sortField === "verified") sortField = "isVerified";

    const allowedSortFields = [
      "name",
      "email",
      "role",
      "createdAt",
      "isActive",
      "isVerified",
      "majority",
      "studyProgram",
    ];

    if (!allowedSortFields.includes(sortField)) {
      console.warn(
        `[Sorting] Invalid field '${sortField}' requested. Falling back to 'createdAt'.`
      );
      sortField = "createdAt";
    }

    const orderBy = {
      [sortField]: String(sortOrder) === "desc" ? "desc" : "asc",
    };

    const users = await db.user.findMany({
      where: whereClause,
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isVerified: true,
        isActive: true,
        majority: true,
        studyProgram: true,
        avatar: true,
        nim: true,
        nip: true,
      },
    });

    console.log(
      `<<< [ADMIN] getActiveUsers - Results: ${users.length} users found.`
    );
    return safeResponse(res, 200, { ok: true, data: users });
  } catch (error: any) {
    console.error("[ActiveUsers Error]", error.message);
    return safeResponse(res, 500, {
      error: `Database error: ${error.message}`,
    });
  }
};

// 4. Get User By ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isVerified: true,
        isActive: true,
        majority: true,
        studyProgram: true,
        avatar: true,
        nim: true,
        nip: true,
        personalEmail: true,
        isApproved: true,
      },
    });

    if (!user) {
      return safeResponse(res, 404, { error: "User not found" });
    }

    return safeResponse(res, 200, { ok: true, data: user });
  } catch (error: any) {
    console.error("[GetUserById Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch user details" });
  }
};

// --- USER ACTIONS ---

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isApproved: true },
    });
    return safeResponse(res, 200, {
      message: "User approved successfully",
      user: updated,
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to approve user" });
  }
};

export const verifyTeacher = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    return safeResponse(res, 200, {
      message: "Teacher verified",
      user: updated,
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Verification failed" });
  }
};

export const unverifyUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isVerified: false },
    });
    return safeResponse(res, 200, {
      message: "Teacher unverified",
      user: updated,
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Unverify failed" });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return safeResponse(res, 200, { message: "User banned", user: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Ban failed" });
  }
};

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    return safeResponse(res, 200, { message: "User unbanned", user: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Unban failed" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentAdminId = req.user?.id;

    if (currentAdminId === userId) {
      return safeResponse(res, 400, { error: "Cannot delete self" });
    }

    await db.user.delete({ where: { id: userId } });
    return safeResponse(res, 200, { message: "User deleted" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Deletion failed" });
  }
};

// --- BULK ---
export const bulkCreateUsers = async (req: Request, res: Response) => {
  try {
    const { users, defaultPassword } = req.body;
    if (!users || !Array.isArray(users))
      return safeResponse(res, 400, { error: "Invalid data" });

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const results = await Promise.all(
      users.map(async (u) => {
        try {
          await db.user.create({
            data: {
              ...u,
              password: hashedPassword,
              isApproved: true,
              isActive: true,
              // Handle optional fields
              nim: u.role === "STUDENT" ? u.nim : null,
              nip: u.role === "TEACHER" ? u.nip : null,
            },
          });
          return { email: u.email, status: "ok" };
        } catch (e: any) {
          return { email: u.email, status: "error", message: e.message };
        }
      })
    );

    return safeResponse(res, 200, { ok: true, results });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Bulk import failed" });
  }
};
