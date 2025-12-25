// backend/src/controllers/cbtController.ts
import { Request, Response } from "express";
import { PrismaClient, Question, Option } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Create Exam (Sesi Ujian)
export const createExam = async (req: Request, res: Response) => {
  try {
    const { title, duration, passingGrade, courseId } = req.body;

    const exam = await prisma.exam.create({
      data: {
        title,
        durationMinutes: parseInt(duration), // Fixed: duration -> durationMinutes
        passingScore: parseInt(passingGrade), // Fixed: passingGrade -> passingScore (Int)
        courseId,
      },
    });

    res.status(201).json({ ok: true, exam });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 2. Add Question to Exam (With Options relation)
export const addQuestion = async (req: Request, res: Response) => {
  try {
    const {
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer, // "A", "B", "C", "D"
      explanation, // Note: Schema doesn't have explanation field for Question, ignoring or assuming text/description? Schema says text only.
      // Ignoring explanation for now as it's not in schema.
      examId,
    } = req.body;

    // Map "A", "B", "C", "D" to manual options
    const optionsData = [
      { text: optionA, isCorrect: correctAnswer === "A" },
      { text: optionB, isCorrect: correctAnswer === "B" },
      { text: optionC, isCorrect: correctAnswer === "C" },
      { text: optionD, isCorrect: correctAnswer === "D" },
    ];

    const question = await prisma.question.create({
      data: {
        text,
        examId,
        options: {
          create: optionsData.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    res.status(201).json({ ok: true, question });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 3. Get Exam Questions (Untuk Siswa Mengerjakan)
export const getExamQuestions = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            position: true,
            options: {
              select: {
                id: true,
                text: true,
                // Hide isCorrect from student
              },
            },
          },
        },
      },
    });
    res.json({ ok: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 4. Submit Exam (Hitung Nilai)
export const submitExam = async (req: Request, res: Response) => {
  try {
    const { studentId, examId, answers } = req.body; // answers = { "qId1": "optionId1", "qId2": "optionId2" }

    // Ambil Soal + Kunci Jawaban (Option.isCorrect)
    const questions = await prisma.question.findMany({
      where: { examId },
      include: { options: true },
    });

    let correctCount = 0;

    questions.forEach((q) => {
      // User answer is Option ID
      const userOptionId = answers[q.id];
      if (userOptionId) {
        // Find if the selected option is correct
        const selectedOption = q.options.find((opt) => opt.id === userOptionId);
        if (selectedOption && selectedOption.isCorrect) {
          correctCount++;
        }
      }
    });

    // Hitung Score
    const score =
      questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    const passStatus = score >= 70 ? "PASSED" : "FAILED"; // Basic logic, ideally fetch exam.passingScore

    // Simpan Hasil (Model: ExamResult)
    const result = await prisma.examResult.create({
      data: {
        studentId,
        examId,
        score,
        status: passStatus,
        finishedAt: new Date(),
      },
    });

    res.json({ ok: true, score, result });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
