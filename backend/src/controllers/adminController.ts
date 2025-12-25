import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Verify Teacher (Only Admins)
export const verifyTeacher = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true } as any,
    });

    res.json({ message: "Teacher verified successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify teacher" });
  }
};

// 1.5 Unverify User (Revoke Access)
export const unverifyUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: false } as any,
    });

    res.json({ message: "User verification revoked", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to revoke verification" });
  }
};

// 2. Ban User (Only Admins)
export const banUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    // Toggle Active Status? Or just Ban? Let's just set to false as per req.
    // But maybe toggle is better UX? Let's stick to simple "ban" (isActive=false) for now or accept body.
    // Requirement says "Ban Button: Toggles isActive: false".

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false } as any,
    });

    res.json({ message: "User has been banned", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to ban user" });
  }
};

// 3. Unban User (Optional context, but useful)
export const unbanUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true } as any,
    });
    res.json({ message: "User unbanned", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Failed to unban user" });
  }
};

// 4. Delete User (Hard Delete)
export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;

    // Optional: Prevent deleting self or other admins if needed
    // const targetUser = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "User deleted permanently" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// 3. Get Dashboard Stats
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const totalUsers = await prisma.user.count();
    const pendingTeachers = await prisma.user.count({
      where: { role: "teacher", isVerified: false } as any,
    });
    const totalCertificates = await prisma.certificate.count();
    const totalCourses = await prisma.course.count();

    // Get Recent Certificates (Ledger Preview)
    const recentActivity = await prisma.certificate.findMany({
      take: 5,
      orderBy: { issuedAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    res.json({
      stats: {
        totalUsers,
        pendingTeachers,
        totalCertificates,
        totalCourses,
      },
      recentActivity,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
