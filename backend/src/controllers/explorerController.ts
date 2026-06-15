import { Request, Response } from "express";
import { db } from "../config/db";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await db.user.count();
    const totalCourses = await db.course.count();
    const totalModules = await db.module.count();

    res.json({
      ok: true,
      data: {
        totalUsers,
        totalCourses,
        totalModules,
      },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ ok: false, error: "Failed to fetch explorer stats" });
  }
};
