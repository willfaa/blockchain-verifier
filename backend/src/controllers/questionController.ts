import { Request, Response } from "express";
import prisma from "../config/db";

// POST /api/courses/:courseId/exam/questions
// Actually typically we add questions to an EXAM, not a COURSE directly?
// But if strict 1-to-1, we find the exam by courseId.
export const addQuestionToCourseExam = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { text, type, points, options } = req.body;
    // options: { text, isCorrect }[]

    // 1. Find the Exam for this Course
    let exam = await prisma.exam.findUnique({
      where: { courseId } as any,
    });

    if (!exam) {
      // Auto-create draf exam if it doesn't exist yet
      exam = await prisma.exam.create({
        data: {
          courseId,
          title: "Course Final Exam",
          description: "Default instructions",
          durationMinutes: 60,
          passingScore: 70,
          isEnabled: false,
        } as any,
      });
    }

    // 2. Create Question
    const question = await prisma.question.create({
      data: {
        examId: exam.id,
        text,
        type: type || "MULTIPLE_CHOICE",
        points: Number(points) || 10,
        isActive: true, // Default active on manual add?
        position: 0, // Logic for append could be added
        options: {
          create: options.map((o: any) => ({
            text: o.text,
            isCorrect: o.isCorrect === true || o.isCorrect === "true",
          })),
        },
      } as any,
      include: { options: true },
    });

    res.status(201).json({ ok: true, data: question });
  } catch (err: any) {
    console.error("Add Question Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/courses/:courseId/exam/questions/bulk
export const bulkAddQuestions = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { questions } = req.body; // Array of questions

    const exam = await prisma.exam.findFirst({ where: { courseId } });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // Transactional Bulk Create
    // Note: Prisma createMany doesn't support nested relations (options).
    // So we map map over creates or use transaction.
    const created = await prisma.$transaction(
      questions.map((q: any) =>
        prisma.question.create({
          data: {
            examId: exam.id,
            text: q.text,
            type: q.type || "MULTIPLE_CHOICE",
            points: q.points || 10,
            isActive: false, // Bulk import usually inactive until reviewed? Or active. Let's say false.
            options: {
              create: q.options.map((o: any) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          } as any,
        })
      )
    );

    res.json({ ok: true, count: created.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/questions/:id/toggle
export const toggleQuestionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) return res.status(404).json({ error: "Question not found" });

    // Cast question to any to access potentially stale property
    const currentActive = (question as any).isActive;

    const updated = await prisma.question.update({
      where: { id },
      data: { isActive: !currentActive } as any,
    });

    res.json({ ok: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
// DELETE /api/questions/:id
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
