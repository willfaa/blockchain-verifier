// @ts-nocheck
// backend/src/controllers/cbtController.ts
import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db";

const prisma = db;

// Types for JSON Structure
interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

// 1. Create Exam (Sesi Ujian)
export const createExam = async (req: Request, res: Response) => {
  try {
    const { title, duration, passingGrade, courseId, questions } = req.body;

    // TEMPORARY FIX: If frontend sends 'courseId' but not 'moduleId', try to find/create a general module.
    let targetModuleId = req.body.moduleId;

    if (!targetModuleId && courseId) {
      // Find existing module or create one
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { modules: true },
      });
      if (course && course.modules.length > 0) {
        targetModuleId = course.modules[0].id;
      } else {
        // Create a default module "Exams"
        const newMod = await prisma.module.create({
          data: { title: "General Exams", courseId, position: 999 },
        });
        targetModuleId = newMod.id;
      }
    }

    if (!targetModuleId) {
      return res
        .status(400)
        .json({ ok: false, error: "Module ID is required for Exam" });
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        // durationMinutes removed from schema
        questions: questions || [], // Start empty or with provided
        position: 0,
        moduleId: targetModuleId,
      },
    });

    res.status(201).json({ ok: true, exam });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 2. Add Question to Exam (JSON Push)
export const addQuestion = async (req: Request, res: Response) => {
  try {
    const {
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer, // "A", "B", "C", "D"
      examId,
    } = req.body;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // Map "A", "B", "C", "D" to manual options
    const newOptions: Option[] = [
      { id: uuidv4(), text: optionA, isCorrect: correctAnswer === "A" },
      { id: uuidv4(), text: optionB, isCorrect: correctAnswer === "B" },
      { id: uuidv4(), text: optionC, isCorrect: correctAnswer === "C" },
      { id: uuidv4(), text: optionD, isCorrect: correctAnswer === "D" },
    ];

    const newQuestion: Question = {
      id: uuidv4(),
      text,
      options: newOptions,
    };

    // Cast existing JSON to Question array
    const currentQuestions = (exam.questions as unknown as Question[]) || [];
    const updatedQuestions = [...currentQuestions, newQuestion];

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        questions: updatedQuestions as any, // Cast back to compatible JSON
      },
    });

    res.status(201).json({ ok: true, data: updatedExam });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 3. Get Exam Questions (Mask Answer for Student)
export const getExamQuestions = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const exam = await prisma.exam.findUnique({ where: { id: examId } });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const questions = (exam.questions as unknown as Question[]) || [];

    // Mask isCorrect
    const safeQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        // Omit isCorrect
      })),
    }));

    res.json({
      ok: true,
      data: {
        ...exam,
        questions: safeQuestions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 4. Submit Exam (Calculate Score)
export const submitExam = async (req: Request, res: Response) => {
  try {
    const { studentId, examId, answers } = req.body; // answers: { [questionId]: optionId }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const questions = (exam.questions as unknown as Question[]) || [];
    let correctCount = 0;

    questions.forEach((q) => {
      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        const option = q.options.find((opt) => opt.id === selectedOptionId);
        if (option && option.isCorrect) {
          correctCount++;
        }
      }
    });

    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Optional: Get passing score from exam (schema didn't explicitly have it in revised version, let's assume default 70 or check implementation)
    // Wait, implementation plan said "Removed Question/Option tables", did it keep passingScore in Exam?
    // Let's check schema details. Schema has: passingScore Int @default(70) removed?
    // User request: "Exam ... title ... questions (Json) ... position".
    // It didn't mention passingScore. But my schema.prisma overwrite (which I did in step 9124) did NOT include `passingScore`.
    // It only had `id`, `title`, `questions`, `position`, `moduleId`.
    // So `passingScore` is GONE from database.
    const PASSING_SCORE = 70;
    const passStatus = score >= PASSING_SCORE ? "PASSED" : "FAILED";

    const result = await prisma.examResult.create({
      data: {
        studentId,
        examId,
        score,
        status: passStatus,
        startedAt: new Date(), // Mock, ideally passed from frontend
        finishedAt: new Date(),
      },
    });

    res.json({ ok: true, score, result });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
