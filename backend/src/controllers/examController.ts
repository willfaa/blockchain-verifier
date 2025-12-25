import { Request, Response } from "express";
import prisma from "../config/db";
import * as ExcelService from "../utils/excelService";

// GET /api/lms/courses/:courseId/exam
export const getCourseExam = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    // 1-to-1: findUnique by courseId
    // Cast to any because Prisma Client might not have updated the unique constraint type yet
    const exam = await prisma.exam.findUnique({
      where: { courseId } as any,
      include: {
        questions: {
          orderBy: { position: "asc" } as any,
          include: { options: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    // Return null or empty if not found? Or 404?
    // Usually valid to have NO exam yet.
    if (!exam) {
      return res.json({ data: null });
    }

    res.json({ data: exam });
  } catch (err: any) {
    console.error("Error in getCourseExam:", err); // Added log
    res.status(500).json({ error: err.message });
  }
};

// POST /api/lms/courses/:courseId/exam (Upsert Settings)
export const upsertExam = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      description,
      durationMinutes,
      passingScore,
      isEnabled,
      strictMode,
    } = req.body;

    // Use transaction or simple upsert
    // Cast update/create blocks to any to bypass stale types for new fields
    const exam = await prisma.exam.upsert({
      where: { courseId } as any,
      update: {
        title,
        description,
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        isEnabled: isEnabled === true || isEnabled === "true", // Handle string/bool
        // @ts-ignore
        strictMode: strictMode === true || strictMode === "true", // Handle string/bool safely
        // @ts-ignore
        isPractice:
          req.body.isPractice === true || req.body.isPractice === "true",
      } as any,
      create: {
        courseId,
        title: title || "New Exam",
        description,
        durationMinutes: Number(durationMinutes) || 60,
        passingScore: Number(passingScore) || 70,
        isEnabled: isEnabled === true || isEnabled === "true",
        // @ts-ignore
        strictMode: strictMode === true || strictMode === "true" || false,
        // @ts-ignore
        isPractice:
          req.body.isPractice === true ||
          req.body.isPractice === "true" ||
          false,
      } as any,
    });

    res.status(200).json({ message: "Exam settings saved", data: exam });
  } catch (err: any) {
    console.error("Upsert Exam Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/lms/exams/:id/take
export const getExamForAttempt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    console.log(`[ExamAttempt] HITTING CONTROLLER with ID: ${id}`);

    // 1. RAW CHECK
    const examRaw = await prisma.exam.findUnique({
      where: { id },
    });
    console.log(`[ExamAttempt] DB RESULT:`, examRaw ? "FOUND" : "NULL");

    if (!examRaw) {
      // Debug: List all IDs to see what we have
      const allIds = await prisma.exam.findMany({ select: { id: true } });
      console.log(
        "AVAILABLE EXAM IDs:",
        allIds.map((e) => e.id)
      );
      return res.status(404).json({ error: "Exam ID not found in database" });
    }

    // 2. CHECK STATUS
    console.log("Exam Enabled Status:", examRaw.isEnabled);
    if (!examRaw.isEnabled) {
      console.log("Exam is disabled, but proceeding for debug/admin?");
      // Uncomment to enforce stricter rule:
      // return res.status(403).json({ error: "Exam is disabled" });
    }

    // 3. FETCH WITH RELATIONS (Simplified Include)
    // 3. FETCH WITH RELATIONS (Simplified Include)
    const exam = await prisma.exam.findUnique({
      where: { id }, // JUST the ID
      include: {
        questions: {
          orderBy: { position: "asc" },
          include: { options: { select: { id: true, text: true } } }, // Exclude isCorrect
        },
        course: { select: { id: true, title: true } },
      },
    });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // --- SECURITY CHECK: ENROLLMENT ---
    const isEnrolled = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: exam.courseId,
      },
      // ----------------------------------
    });

    if (!isEnrolled) {
      return res.status(403).json({
        ok: false,
        error: "You must enroll in this course to take the exam.",
        courseId: exam.courseId,
      });
    }
    // ----------------------------------

    res.json({ data: exam });
  } catch (err: any) {
    console.error("Error in getExamForAttempt:", err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/lms/exams/:id/submit
export const submitExamAttempt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { answers } = req.body; // { questionId: optionId }

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // 1. Fetch Exam with Correct Answers (Active Only)
    // Cast include to any
    const includeQuery: any = {
      questions: {
        where: { isActive: true },
        include: {
          options: true,
        },
      },
    };

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: includeQuery,
    });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // --- SECURITY CHECK: ENROLLMENT ---
    const isEnrolled = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: exam.courseId,
      },
      // ----------------------------------
    });

    if (!isEnrolled) {
      return res.status(403).json({
        ok: false,
        error: "You must enroll in this course to submit the exam.",
      });
    }
    // ----------------------------------

    // 2. Calculate Score
    let totalPoints = 0;
    let maxPoints = 0;

    const examAny = exam as any;
    examAny.questions.forEach((q: any) => {
      maxPoints += q.points;

      const selectedOptionId = answers[q.id];
      if (selectedOptionId) {
        // Find if selected option is correct
        const correctOption = q.options.find((o: any) => o.isCorrect);
        if (correctOption && correctOption.id === selectedOptionId) {
          totalPoints += q.points;
        }
      }
    });

    // Avoid division by zero
    const finalScore = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
    const status = finalScore >= exam.passingScore ? "PASSED" : "FAILED";

    // --- CHECK PRACTICE MODE ---
    // @ts-ignore
    if (exam.isPractice) {
      return res.json({
        ok: true,
        data: {
          score: finalScore,
          status: status,
          totalPoints,
          maxPoints,
          resultId: "practice-mode",
          isPractice: true,
        },
      });
    }

    // 3. Save Result with Answers
    const result = await prisma.examResult.create({
      data: {
        score: finalScore,
        status: status,
        studentId: userId,
        examId: id,
        // @ts-ignore
        answers: {
          create: Object.entries(answers).map(([qId, oId]) => ({
            questionId: qId,
            optionId: oId as string,
          })),
        },
      },
      // Include answers in return? Not strictly needed unless UI wants to show immediate detailed review
      // include: { answers: true }
    });

    res.json({
      ok: true,
      data: {
        score: finalScore,
        status: status,
        totalPoints,
        maxPoints,
        resultId: result.id,
        isPractice: false,
      },
    });
  } catch (err: any) {
    console.error("Submit Exam Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- ANALYTICS ---

export const getExamSubmissions = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    // Fetch all results for this exam
    const submissions = await prisma.examResult.findMany({
      where: { examId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        // @ts-ignore
        answers: {
          include: {
            question: { select: { id: true, text: true, points: true } },
            option: { select: { id: true, text: true, isCorrect: true } },
          },
        },
      },
      orderBy: { finishedAt: "desc" },
    });

    // Calculate Analytics
    const totalAttempts = submissions.length;
    const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
    const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;

    // Calculate Hardest Question
    // Map: QuestionID -> IncorrectCount
    const questionStats: Record<string, { text: string; incorrect: number }> =
      {};

    (submissions as any).forEach((sub: any) => {
      sub.answers.forEach((ans: any) => {
        if (!ans.option.isCorrect) {
          if (!questionStats[ans.questionId]) {
            questionStats[ans.questionId] = {
              text: ans.question.text,
              incorrect: 0,
            };
          }
          questionStats[ans.questionId].incorrect++;
        }
      });
    });

    // Find max
    let hardestQuestion = null;
    let maxIncorrect = -1;
    Object.values(questionStats).forEach((stat) => {
      if (stat.incorrect > maxIncorrect) {
        maxIncorrect = stat.incorrect;
        hardestQuestion = `${stat.text} (${stat.incorrect} wrong answers)`;
      }
    });

    res.json({
      ok: true,
      data: {
        submissions,
        analytics: {
          totalAttempts: totalAttempts,
          avgScore: Math.round(avgScore * 10) / 10,
          hardestQuestion: hardestQuestion || "N/A",
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.examResult.delete({ where: { id } });
    res.json({ ok: true, message: "Submission deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/lms/courses/:courseId/exam-results
// Returns list of enrolled students with their BEST exam attempt info
export const getCourseExamResults = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // 1. Get Course Exam ID
    const exam = await prisma.exam.findUnique({
      where: { courseId },
      select: { id: true, passingScore: true },
    });

    if (!exam) {
      return res.status(200).json({ ok: true, data: [] }); // No exam = no results
    }

    // 2. Get Enrolled Students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            studyProgram: true,
            majority: true,
          },
        },
      },
    });

    // 3. Get All Exam Results for this Exam
    const results = await prisma.examResult.findMany({
      where: { examId: exam.id },
      orderBy: { score: "desc" }, // Order by score to easily pick best? Or just fetch all.
    });

    // 4. Aggregate: Map Student -> Best Attempt
    const gradebook = enrollments.map((enrollment) => {
      // @ts-ignore
      const student = enrollment.user;

      // Filter student's attempts
      const attempts = results.filter((r) => r.studentId === student.id);

      // Find Best Attempt (Highest Score)
      // Since we didn't sort findMany by student, we sort here or reduce
      const bestAttempt =
        attempts.length > 0
          ? attempts.reduce((prev, current) =>
              prev.score > current.score ? prev : current
            )
          : null;

      return {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          program: student.studyProgram,
          majority: student.majority,
        },
        hasAttempt: !!bestAttempt,
        attemptsCount: attempts.length,
        bestScore: bestAttempt ? bestAttempt.score : 0,
        status: bestAttempt ? bestAttempt.status : "NOT_STARTED", // PASSED | FAILED | NOT_STARTED
        lastAttemptAt: bestAttempt ? bestAttempt.finishedAt : null,
        isPassed: bestAttempt ? bestAttempt.score >= exam.passingScore : false,
        resultId: bestAttempt ? bestAttempt.id : null,
      };
    });

    res.json({ ok: true, data: gradebook });
  } catch (error: any) {
    console.error("Get Course Results Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/lms/exams/results/:id
export const getExamResultDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await prisma.examResult.findUnique({
      where: { id },
      include: {
        // @ts-ignore
        answers: {
          include: {
            question: { select: { text: true, points: true } },
            option: { select: { text: true, isCorrect: true } },
          },
        },
      },
    });

    if (!result) return res.status(404).json({ error: "Result not found" });

    res.json({ ok: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- EXCEL IMPORT / EXPORT ---

// GET /api/lms/exams/template
export const downloadQuestionTemplate = async (req: Request, res: Response) => {
  try {
    const buffer = ExcelService.generateQuestionTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Question_Template.xlsx"
    );
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/lms/exams/:id/questions/import
export const importQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Parse Excel
    const questions = ExcelService.parseQuestionFile(file.buffer);

    if (questions.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid questions found in file" });
    }

    // 2. Transactional Insert
    await prisma.$transaction(async (tx) => {
      for (const q of questions) {
        const createdQ = await tx.question.create({
          data: {
            examId: id,
            text: q.text,
            points: q.points,
            isActive: true,
            type: "MULTIPLE_CHOICE",
          },
        });

        // Create Options
        if (q.options.length > 0) {
          await tx.option.createMany({
            data: q.options.map((opt: any) => ({
              questionId: createdQ.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          });
        }
      }
    });

    res.json({
      ok: true,
      message: `Successfully imported ${questions.length} questions`,
    });
  } catch (error: any) {
    console.error("Import Error:", error);
    res
      .status(500)
      .json({ error: "Failed to import questions: " + error.message });
  }
};

// GET /api/lms/exams/:id/export
export const exportExamGrades = async (req: Request, res: Response) => {
  // Reuse logic from getCourseExamResults but format as Excel
  try {
    const { id } = req.params; // Exam ID

    // Verify Exam exists
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // Get Results & Students (similar to gradebook logic)
    // Note: For export of a specific Exam, we usually want all students even if they haven't taken it,
    // OR just the results. Let's do ALL students (gradebook style).

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: exam.courseId },
      include: { user: true },
    });

    const results = await prisma.examResult.findMany({
      where: { examId: id },
      orderBy: { score: "desc" },
    });

    // Aggregate
    const reportData = enrollments.map((enrollment) => {
      const student = enrollment.user;
      const attempts = results.filter((r) => r.studentId === student.id);
      const bestAttempt =
        attempts.length > 0
          ? attempts.reduce((prev, current) =>
              prev.score > current.score ? prev : current
            )
          : null;

      return {
        student: { name: student.name, email: student.email },
        attemptsCount: attempts.length,
        bestScore: bestAttempt ? bestAttempt.score : 0,
        status: bestAttempt ? bestAttempt.status : "NOT_STARTED",
        lastAttemptAt: bestAttempt ? bestAttempt.finishedAt : null,
      };
    });

    const buffer = ExcelService.generateGradeReport(reportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Grades_${exam.title.replace(/\s+/g, "_")}.xlsx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Export Error:", error);
    res.status(500).json({ error: error.message });
  }
};
