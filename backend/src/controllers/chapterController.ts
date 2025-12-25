import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createChapter = async (req: Request, res: Response) => {
  try {
    const { title, courseId, order } = req.body;

    if (!title || !courseId) {
      return res
        .status(400)
        .json({ ok: false, error: "Title and CourseID required" });
    }

    // Default order logic: Find max order + 1
    let finalOrder = order ? parseInt(order) : 0;
    if (order === undefined) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
      });
      finalOrder = lastChapter ? lastChapter.order + 1 : 1;
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        courseId,
        order: finalOrder,
      },
    });

    res.status(201).json({ ok: true, chapter });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const deleteChapter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.chapter.delete({ where: { id } });
    res.json({ ok: true, message: "Chapter deleted" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
