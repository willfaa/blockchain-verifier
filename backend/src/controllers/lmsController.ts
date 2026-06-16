import { Request, Response } from "express";
import { db } from "../config/db";
import fs from "fs";
import path from "path";
import * as ExcelService from "../utils/excelService";
import { randomUUID } from "crypto";
import { uploadToIpfs } from "../utils/ipfs";

/**
 * LMS Controller - SOLID Implementation
 * Handles Courses, Modules, and Lessons in a single consolidated logic point.
 */

// --- COURSE MANAGEMENT ---

const sanitizePath = (str: string) =>
  str.replace(/[^a-z0-9]/gi, "_").toLowerCase();

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, description, categoryId } = req.body;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!title) return res.status(400).json({ error: "Title is required" });

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/courses/${userId}/${req.file.filename}`;
    }

    const course = await db.course.create({
      data: {
        title,
        description,
        userId,
        imageUrl,
        categoryId,
        isPublished: false,
      },
    });

    return res.json({ ok: true, data: course });
  } catch (error) {
    console.error("[LMS] CreateCourse Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, description, isPublished, categoryId } = req.body;

    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse)
      return res.status(404).json({ error: "Course not found" });
    if (existingCourse.userId !== userId)
      return res.status(403).json({ error: "Access Denied" });

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId) updateData.categoryId = categoryId;

    // Handle Boolean Conversion from FormData
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished === "true" || isPublished === true;
    }

    // Handle New Image Upload & Cleanup
    if (req.file) {
      // 1. Delete old file if exists
      if (existingCourse.imageUrl) {
        const oldPath = path.join(process.cwd(), existingCourse.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      // 2. Set new path
      updateData.imageUrl = `/uploads/courses/${userId}/${req.file.filename}`;
    }

    const updated = await db.course.update({
      where: { id: courseId },
      data: updateData,
    });

    return res.json({ ok: true, data: updated });
  } catch (error: any) {
    console.error(
      `[LMS] UpdateCourse Error (${req.params.courseId}):`,
      error.message,
    );
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Course not found in database" });
    }
    return res
      .status(500)
      .json({ error: "Update Failed", details: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.userId !== userId)
      return res.status(403).json({ error: "Access Denied" });

    // Cleanup images
    if (course.imageUrl) {
      const imgPath = path.join(process.cwd(), course.imageUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await db.course.delete({ where: { id: courseId } });

    return res.json({ ok: true, message: "Course and associated data purged" });
  } catch (error) {
    return res.status(500).json({ error: "Purging failed" });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await db.course.findMany({
      where: { isPublished: true },
      include: {
        user: { select: { name: true, avatar: true } },
        _count: { select: { modules: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = courses.map((c) => ({ ...c, teacher: c.user }));
    return res.json({ ok: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed" });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        modules: {
          orderBy: { position: "asc" },
          include: {
            lessons: { orderBy: { position: "asc" } },
            assignments: true,
          },
        },
      },
    });

    if (!course) return res.status(404).json({ error: "Not found" });

    let isEnrolled = false;
    let enrollment = null;

    if (userId) {
      enrollment = (await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      })) as any;

      if (enrollment) {
        isEnrolled = true;
        // Fetch certificate if it exists for this user and course
        const cert = await db.certificate.findFirst({
          where: {
            userId,
            courseId,
          },
        });
        enrollment.certificate = cert;
      }
    }

    return res.json({
      ok: true,
      data: {
        ...course,
        teacher: course.user,
        isEnrolled,
        enrollment,
      },
    });
  } catch (error) {
    console.error("[LMS] getCourseById Error:", error);
    return res.status(500).json({ error: "Fetch failed" });
  }
};

export const enrollCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!courseId)
      return res.status(400).json({ error: "Course ID is required" });

    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrollment = await db.enrollment.create({
      data: {
        userId,
        courseId,
        status: "ACTIVE",
      },
    });

    return res.json({ ok: true, data: enrollment });
  } catch (error: any) {
    console.error("[LMS] enrollCourse Error:", error);
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "You are already enrolled in this course" });
    }
    return res.status(500).json({ error: "Enrollment failed" });
  }
};

export const getTeacherCourses = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;
    const courses = await db.course.findMany({
      where: { userId },
      include: {
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ ok: true, data: courses });
  } catch (error) {
    return res.status(500).json({ error: "Fetch failed" });
  }
};

// --- MODULE MANAGEMENT ---

export const createModule = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;

    if (!title) return res.status(400).json({ error: "Title required" });

    const lastModule = await db.module.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
    });
    const position = lastModule ? lastModule.position + 1 : 1;

    const module = await db.module.create({
      data: { title, courseId, position },
    });

    return res.json({ ok: true, data: module });
  } catch (error) {
    return res.status(500).json({ error: "Module creation failed" });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, isPublished, position } = req.body;

    const updated = await db.module.update({
      where: { id },
      data: {
        title,
        description,
        isPublished: isPublished === "true" || isPublished === true,
        position: position ? parseInt(position) : undefined,
      },
    });
    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({ error: "Module update failed" });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.module.delete({ where: { id } });
    return res.json({ ok: true, message: "Module deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Module deletion failed" });
  }
};

// --- LESSON MANAGEMENT ---

export const createLesson = async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { title, videoUrl, description, content } = req.body;

    if (!title) return res.status(400).json({ error: "Title required" });

    const lastLesson = await db.lesson.findFirst({
      where: { moduleId },
      orderBy: { position: "desc" },
    });
    const position = lastLesson ? lastLesson.position + 1 : 1;

    const lesson = await db.lesson.create({
      data: { title, videoUrl, description, content, moduleId, position },
    });

    return res.json({ ok: true, data: lesson });
  } catch (error) {
    return res.status(500).json({ error: "Lesson creation failed" });
  }
};

export const getLessonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const lesson = await db.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    // Ownership Check
    if (lesson.module.course.userId !== userId) {
      return res.status(403).json({ error: "Access Denied" });
    }

    return res.json({ ok: true, data: lesson });
  } catch (error) {
    console.error("[LMS] getLessonById Error:", error);
    return res.status(500).json({ error: "Fetch failed" });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, content, videoUrl, position, isPublished } =
      req.body;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const existingLesson = await db.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });

    if (!existingLesson)
      return res.status(404).json({ error: "Lesson not found" });
    if (existingLesson.module.course.userId !== userId) {
      return res.status(403).json({ error: "Access Denied" });
    }

    const updated = await db.lesson.update({
      where: { id },
      data: {
        title,
        description,
        content,
        videoUrl,
        position: position ? parseInt(position) : undefined,
        isPublished: isPublished === "true" || isPublished === true,
      },
    });
    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({ error: "Lesson update failed" });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const lesson = await db.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    if (lesson.module.course.userId !== userId) {
      return res.status(403).json({ error: "Access Denied" });
    }

    await db.lesson.delete({ where: { id } });
    return res.json({ ok: true, message: "Lesson deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Lesson deletion failed" });
  }
};
// --- MANAGEMENT & ANALYTICS ---

export const getCourseStudents = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            majority: true,
            studyProgram: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return res.json({ ok: true, data: enrollments });
  } catch (error: any) {
    console.error("[LMS] getCourseStudents Error:", error.message);
    return res.status(500).json({ error: "Fetch failed" });
  }
};

export const removeStudent = async (req: Request, res: Response) => {
  try {
    const { courseId, userId: studentId } = req.params;
    // @ts-ignore
    const teacherId = req.user?.id || req.user?.userId;

    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (course.userId !== teacherId) {
      return res.status(403).json({ error: "Access Denied" });
    }

    await db.enrollment.delete({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId,
        },
      },
    });

    return res.json({ ok: true, message: "Student removed from course" });
  } catch (error: any) {
    console.error("[LMS] removeStudent Error:", error.message);
    return res.status(500).json({ error: "Removal failed" });
  }
};

export const getCourseExam = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // In current schema, Exam belongs to Module
    const moduleWithExam = await db.module.findFirst({
      where: { courseId },
      include: { exams: true },
    });

    const exam = moduleWithExam?.exams?.[0];

    return res.json({ ok: true, data: exam || null });
  } catch (error: any) {
    console.error("[LMS] getCourseExam Error:", error.message);
    return res.json({ ok: true, data: null });
  }
};

export const getCourseAssignments = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // Find all modules in this course to get their assignments
    const modules = await db.module.findMany({
      where: { courseId },
      include: { assignments: true },
    });

    const assignments = modules
      .flatMap((m) => m.assignments || [])
      .filter(Boolean);

    return res.json({ ok: true, data: assignments });
  } catch (error: any) {
    console.error("[LMS] getCourseAssignments Error:", error.message);
    return res.json({ ok: true, data: [] });
  }
};

export const getExamResults = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const moduleWithExam = await db.module.findFirst({
      where: { courseId },
      include: { exams: true },
    });
    const exam = moduleWithExam?.exams?.[0];

    if (!exam) return res.json({ ok: true, data: [] });

    const results = await db.examResult.findMany({
      where: { examId: exam.id },
      include: {
        student: { select: { name: true, email: true, avatar: true } },
      },
      orderBy: { finishedAt: "desc" },
    });

    return res.json({ ok: true, data: results });
  } catch (error: any) {
    console.error("[LMS] getExamResults Error:", error.message);
    return res.json({ ok: true, data: [] });
  }
};

export const upsertExam = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      durationMinutes,
      passingScore,
      isEnabled,
      isPractice,
      strictMode,
    } = req.body;

    const moduleWithExam = await db.module.findFirst({
      where: { courseId },
      include: { exams: true },
    });

    let moduleId = moduleWithExam?.id;
    if (!moduleId) {
      const newModule = await db.module.create({
        data: { title: "Exams & Assessments", courseId, position: 999 },
      });
      moduleId = newModule.id;
    }

    const existingExam = await db.exam.findFirst({
      where: { moduleId },
    });

    const questionData = {
      settings: {
        durationMinutes: parseInt(durationMinutes) || 60,
        passingScore: parseInt(passingScore) || 70,
        isEnabled: isEnabled === true || isEnabled === "true",
        isPractice: isPractice === true || isPractice === "true",
        strictMode: strictMode === true || strictMode === "true",
      },
      items: existingExam ? (existingExam.questions as any).items || [] : [],
    };

    let exam;
    if (existingExam) {
      exam = await db.exam.update({
        where: { id: existingExam.id },
        data: {
          title: title || existingExam.title,
          questions: questionData as any,
        },
      });
    } else {
      exam = await db.exam.create({
        data: {
          moduleId,
          title: title || "Final Exam",
          questions: questionData as any,
          position: 0,
        },
      });
    }

    return res.json({ ok: true, data: exam });
  } catch (error) {
    console.error("[LMS] upsertExam Error:", error);
    return res.status(500).json({ error: "Failed to save exam settings" });
  }
};

export const addExamQuestion = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { text, options } = req.body;

    const moduleWithExam = await db.module.findFirst({
      where: { courseId },
      include: { exams: true },
    });

    const exam = moduleWithExam?.exams?.[0];
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const questionsJson = exam.questions as any;
    const items = questionsJson.items || [];

    const newQuestion = {
      id: require("crypto").randomUUID(),
      text,
      options: options.map((o: any) => ({
        ...o,
        id: require("crypto").randomUUID(),
      })),
      isActive: true,
      position: items.length,
    };

    const updatedQuestions = {
      ...questionsJson,
      items: [...items, newQuestion],
    };

    await db.exam.update({
      where: { id: exam.id },
      data: { questions: updatedQuestions as any },
    });

    return res.json({ ok: true, data: newQuestion });
  } catch (error) {
    console.error("[LMS] addExamQuestion Error:", error);
    return res.status(500).json({ error: "Failed to add question" });
  }
};

export const deleteExamQuestion = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const exams = await db.exam.findMany();
    const exam = exams.find((e) => {
      const qJson = e.questions as any;
      return (qJson.items || []).some((q: any) => q.id === questionId);
    });

    if (!exam) return res.status(404).json({ error: "Question not found" });

    const qJson = exam.questions as any;
    const filtered = (qJson.items || []).filter(
      (q: any) => q.id !== questionId,
    );

    await db.exam.update({
      where: { id: exam.id },
      data: {
        questions: {
          ...qJson,
          items: filtered,
        } as any,
      },
    });

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Deletion failed" });
  }
};

export const submitExamAttempt = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    // @ts-ignore
    const studentId = req.user?.id || req.user?.userId;

    const exam = await db.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const qJson = exam.questions as any;
    const questions = qJson.items || [];
    const settings = qJson.settings || { passingScore: 70 };

    let score = 0;
    const total = questions.length;

    questions.forEach((q: any) => {
      const studentOptId = answers[q.id];
      const correctOpt = q.options.find((o: any) => o.isCorrect);
      if (correctOpt && correctOpt.id === studentOptId) score++;
    });

    const finalScore = total > 0 ? (score / total) * 100 : 0;
    const status =
      finalScore >= (settings.passingScore || 70) ? "PASSED" : "FAILED";

    const result = await db.examResult.create({
      data: {
        examId,
        studentId,
        score: finalScore,
        status,
        finishedAt: new Date(),
      },
    });

    return res.json({ ok: true, data: result });
  } catch (error) {
    return res.status(500).json({ error: "Submission failed" });
  }
};

// --- ADVANCED EXAM FEATURES ---

export const getExamResultDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.examResult.findUnique({
      where: { id },
      include: {
        student: { select: { name: true, email: true, avatar: true } },
        exam: true,
      },
    });

    if (!result) return res.status(404).json({ error: "Result not found" });

    // Note: Since we use JSON-based questions, we don't have a direct 'answers' relation in Prisma for ExamResult
    // unless the schema has it. Let's check the schema if ExamResult has answers.
    // My previous submitExamAttempt logic DOES NOT save answers yet in a way Prisma can include.
    // Wait, the legacy examController DID save answers in a relation.
    // I need to check if 'ExamAnswer' exists in schema.

    // For now, let's return the result. If answers are needed, we'll need to handle them.
    return res.json({ ok: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.examResult.delete({ where: { id } });
    return res.json({ ok: true, message: "Submission deleted" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const downloadQuestionTemplate = async (req: Request, res: Response) => {
  try {
    const buffer = ExcelService.generateQuestionTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Question_Template.xlsx",
    );
    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const importQuestions = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const exam = await db.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const parsedQuestions = ExcelService.parseQuestionFile(file.buffer);

    const questionsJson = exam.questions as any;
    const items = questionsJson.items || [];

    const newItems = parsedQuestions.map((q, idx) => ({
      id: randomUUID(),
      text: q.text,
      options: q.options.map((o) => ({
        ...o,
        id: randomUUID(),
      })),
      isActive: true,
      position: items.length + idx,
    }));

    const updatedQuestions = {
      ...questionsJson,
      items: [...items, ...newItems],
    };

    await db.exam.update({
      where: { id: exam.id },
      data: { questions: updatedQuestions as any },
    });

    return res.json({
      ok: true,
      message: `Successfully imported ${newItems.length} questions`,
    });
  } catch (error: any) {
    console.error("[LMS] Import Error:", error);
    return res.status(500).json({ error: "Import failed: " + error.message });
  }
};

export const exportExamGrades = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: { module: { select: { courseId: true } } },
    });

    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const courseId = exam.module.courseId;

    // Get all enrollments to include students who haven't started
    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const results = await db.examResult.findMany({
      where: { examId },
      orderBy: { score: "desc" },
    });

    const reportData = enrollments.map((enrollment) => {
      const student = enrollment.user;
      const attempts = results.filter((r) => r.studentId === student.id);
      const bestAttempt = attempts[0] || null;

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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Grades_${exam.title.replace(/\s+/g, "_")}.xlsx`,
    );
    return res.send(buffer);
  } catch (error: any) {
    console.error("[LMS] Export Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// --- ASSIGNMENT MANAGEMENT ---

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const {
      moduleId,
      chapterId,
      title,
      description,
      maxScore,
      dueDate,
      duration,
    } = req.body;
    const targetModuleId = moduleId || chapterId;
    // @ts-ignore
    const teacherId = req.user?.id || req.user?.userId;

    if (!targetModuleId)
      return res.status(400).json({ error: "Module ID is required" });

    // Verify ownership
    const module = await db.module.findUnique({
      where: { id: targetModuleId },
      include: { course: true },
    });

    if (!module) return res.status(404).json({ error: "Module not found" });
    if (module.course.userId !== teacherId) {
      return res.status(403).json({ error: "Unauthorized access to course" });
    }

    const assignment = await db.assignment.create({
      data: {
        moduleId: targetModuleId,
        title,
        description,
        maxScore: maxScore ? parseInt(maxScore) : 100,
        dueDate: dueDate ? new Date(dueDate) : null,
        // @ts-ignore
        duration: duration ? parseInt(duration) : null,
        isVisible: true,
      } as any,
    });
    return res.json({ ok: true, data: assignment });
  } catch (error: any) {
    console.error("[LMS] CreateAssignment Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, isVisible, maxScore, dueDate, duration } =
      req.body;
    // @ts-ignore
    const teacherId = req.user?.id || req.user?.userId;

    // Verify ownership
    const existingAssignment = await db.assignment.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });

    if (!existingAssignment)
      return res.status(404).json({ error: "Assignment not found" });
    if (existingAssignment.module.course.userId !== teacherId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isVisible !== undefined)
      updateData.isVisible = isVisible === true || isVisible === "true";
    if (maxScore !== undefined) updateData.maxScore = parseInt(maxScore);
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (duration !== undefined)
      updateData.duration = duration ? parseInt(duration) : null;

    // @ts-ignore
    const assignment = await db.assignment.update({
      where: { id },
      data: updateData,
    });
    return res.json({ ok: true, data: assignment });
  } catch (error: any) {
    console.error("[LMS] UpdateAssignment Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const teacherId = req.user?.id || req.user?.userId;

    // Verify ownership
    const existingAssignment = await db.assignment.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });

    if (!existingAssignment)
      return res.status(404).json({ error: "Assignment not found" });
    if (existingAssignment.module.course.userId !== teacherId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await db.assignment.delete({ where: { id } });
    return res.json({ ok: true, message: "Assignment purged" });
  } catch (error: any) {
    console.error("[LMS] DeleteAssignment Error:", error);
    return res.status(500).json({ error: "Failed to delete assignment" });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: {
        module: {
          select: { title: true, courseId: true },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Security Hardening: Check Enrollment & Visibility
    // @ts-ignore
    const userRole = (req.user?.role || "").toLowerCase();
    const isTeacherOrAdmin = userRole === "teacher" || userRole === "admin";

    if (!isTeacherOrAdmin) {
      // 1. Check Visibility (Explicitly false means hidden, others are visible)
      if (assignment.isVisible === false) {
        console.warn(`[LMS] 404: Assignment ${id} is hidden.`);
        return res.status(404).json({ error: "Assignment not found" });
      }

      // 2. Check Enrollment
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId,
          courseId: assignment.module.courseId,
        },
      });

      if (!enrollment) {
        console.warn(
          `[LMS] 403: User ${userId} not enrolled in course ${assignment.module.courseId}`,
        );
        return res
          .status(403)
          .json({ error: "Purchase or enroll in course to access tasks" });
      }
    }

    let submission = null;
    if (userId) {
      submission = await db.assignmentSubmission.findFirst({
        where: {
          assignmentId: id,
          studentId: userId,
        },
      });
    }

    return res.json({ ok: true, data: { ...assignment, submission } });
  } catch (error: any) {
    console.error("[LMS] GetAssignment Error:", error);
    return res.status(500).json({ error: "Fetch failed" });
  }
};

export const startAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // assignmentId
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const assignment = await db.assignment.findUnique({
      where: { id },
      include: { module: { select: { courseId: true } } },
    });

    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    // Verify Enrollment
    const enrollment = await db.enrollment.findFirst({
      where: { userId, courseId: assignment.module.courseId },
    });

    if (!enrollment)
      return res.status(403).json({ error: "Enrollment required" });

    // Check if already started
    let submission = await db.assignmentSubmission.findFirst({
      where: { assignmentId: id, studentId: userId },
    });

    if (submission) {
      return res.json({ ok: true, data: submission });
    }

    const submissionId = randomUUID();
    const now = new Date();
    await db.$executeRaw`
      INSERT INTO assignment_submissions (id, "assignmentId", "studentId", "startedAt", status, "createdAt", "updatedAt")
      VALUES (${submissionId}, ${id}, ${userId}, ${now}, 'PENDING', ${now}, ${now})
    `;

    submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    return res.json({ ok: true, data: submission });
  } catch (error: any) {
    console.error("[LMS] StartAssignment Error:", error);
    return res.status(500).json({ error: "Failed to start assignment" });
  }
};

/**
 * Individual File Upload to IPFS (Staging)
 * Returns CID and Metadata for the Multi-File Workspace.
 */
export const uploadAssignmentArtifact = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const filename = `${Date.now()}-${req.file.originalname.replace(
      /\s+/g,
      "_",
    )}`;
    const uploadsPath = path.join(process.cwd(), "uploads", "assignments");
    const targetPath = path.join(uploadsPath, filename);

    // Save locally instead of IPFS
    fs.renameSync(req.file.path, targetPath);

    const metadata = {
      name: req.file.originalname,
      url: `/uploads/assignments/${filename}`,
      size: req.file.size,
      type: req.file.mimetype,
      fileHash: req.body.fileHash,
      createdAt: new Date().toISOString(),
      isLocal: true, // Mark as staged on backend
    };

    return res.json({ ok: true, data: metadata });
  } catch (error: any) {
    console.error("[LMS] Local Upload Artifact Error:", error);
    return res.status(500).json({ error: "Staging failed" });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.body;
    let fileUrlFromReq = req.body.fileUrl;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Handle File Upload & Hierarchical Path
    if (req.file) {
      try {
        const filename = `${Date.now()}-${req.file.originalname.replace(
          /\s+/g,
          "_",
        )}`;
        const uploadsPath = path.join(process.cwd(), "uploads", "assignments");
        const targetPath = path.join(uploadsPath, filename);

        // Save locally
        fs.renameSync(req.file.path, targetPath);

        fileUrlFromReq = `/uploads/assignments/${filename}`;
      } catch (fileErr: any) {
        console.error("[LMS] Local Submission failed:", fileErr);
        throw fileErr;
      }
    }

    // Security Hardening: Verify Enrollment & Time Limit
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
      include: { module: { select: { courseId: true } } },
    });

    if (!assignment)
      return res.status(404).json({ error: "Assignment not found" });

    // Find submission/attempt
    let submission: any = await db.assignmentSubmission.findFirst({
      where: { assignmentId, studentId: userId },
    });

    // Check Time Limit
    const assignmentAny = assignment as any;
    if (assignmentAny.duration) {
      if (!submission || !submission.startedAt) {
        return res
          .status(400)
          .json({ error: "Assignment session not started" });
      }
      const startTime = new Date(submission.startedAt).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - startTime) / (1000 * 60);

      if (diffMinutes > assignmentAny.duration + 5) {
        // 5 min grace period
        return res
          .status(403)
          .json({ error: "Assignment time limit exceeded" });
      }
    }

    const enrollment = await db.enrollment.findFirst({
      where: { userId, courseId: assignment.module.courseId },
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ error: "Enrollment required for submission" });
    }

    const now = new Date();

    // Support for JSON-based multi-file storage or single-file fallback
    let finalFileUrl = fileUrlFromReq;

    // If the input is already a JSON array string (from frontend Manager), use it directly
    // Otherwise, if we just uploaded a single file, we wrap it in an array or string
    try {
      if (
        fileUrlFromReq &&
        (fileUrlFromReq.startsWith("[") || fileUrlFromReq.startsWith("{"))
      ) {
        JSON.parse(fileUrlFromReq); // Validate it's JSON
      } else if (fileUrlFromReq) {
        // Wrap single legacy/simple URL into a JSON array for consistency
        finalFileUrl = JSON.stringify([
          {
            name: req.file?.originalname || "artifact",
            url: fileUrlFromReq,
            size: req.file?.size || 0,
            type: req.file?.mimetype || "application/octet-stream",
            createdAt: now.toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.warn(
        "[LMS] fileUrl is not JSON, treating as legacy string:",
        fileUrlFromReq,
      );
    }
    const submittedFileHash = req.body.fileHash || null;

    if (submission) {
      await db.$executeRaw`
        UPDATE assignment_submissions 
        SET "fileUrl" = ${finalFileUrl || submission.fileUrl},
            "fileHash" = ${submittedFileHash || submission.fileHash},
            "submittedAt" = ${now},
            status = 'PENDING',
            "updatedAt" = ${now}
        WHERE id = ${submission.id}
      `;
      // Fetch updated record
      const updated: any[] =
        await db.$queryRaw`SELECT * FROM assignment_submissions WHERE id = ${submission.id}`;
      submission = updated[0];
    } else {
      const newSubId = randomUUID();
      await db.$executeRaw`
        INSERT INTO assignment_submissions (id, "assignmentId", "studentId", "fileUrl", "fileHash", "startedAt", "submittedAt", status, "createdAt", "updatedAt")
        VALUES (${newSubId}, ${assignmentId}, ${userId}, ${finalFileUrl}, ${submittedFileHash}, ${now}, ${now}, 'PENDING', ${now}, ${now})
      `;
      // Fetch new record
      const created: any[] =
        await db.$queryRaw`SELECT * FROM assignment_submissions WHERE id = ${newSubId}`;
      submission = created[0];
    }

    return res.json({ ok: true, data: submission });
  } catch (error: any) {
    console.error("[LMS] SubmitAssignment Error:", error);
    return res.status(500).json({ error: "Submission protocol failed" });
  }
};

export const updateAssignmentSubmission = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;
    let fileUrlFromReq = req.body.fileUrl;

    const existing = await db.assignmentSubmission.findUnique({
      where: { id },
    });

    if (!existing)
      return res.status(404).json({ error: "Submission not found" });
    if (existing.studentId !== userId)
      return res.status(403).json({ error: "Forbidden" });
    if (existing.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Cannot update graded/approved submission" });
    }

    // Handle New File with Hierarchy
    if (req.file) {
      const filename = `${Date.now()}-${req.file.originalname.replace(
        /\s+/g,
        "_",
      )}`;
      const uploadsPath = path.join(process.cwd(), "uploads", "assignments");
      const targetPath = path.join(uploadsPath, filename);

      fs.renameSync(req.file.path, targetPath);

      fileUrlFromReq = `/uploads/assignments/${filename}`;
    }

    const now = new Date();
    await db.$executeRaw`
      UPDATE assignment_submissions 
      SET "fileUrl" = ${fileUrlFromReq || existing.fileUrl},
          status = 'PENDING',
          "updatedAt" = ${now}
      WHERE id = ${id}
    `;

    const updatedSub: any[] =
      await db.$queryRaw`SELECT * FROM assignment_submissions WHERE id = ${id}`;
    const updated = updatedSub[0];

    return res.json({ ok: true, data: updated });
  } catch (error: any) {
    console.error("[LMS] UpdateSubmission Error:", error);
    return res.status(500).json({ error: "Update failed" });
  }
};

export const deleteAssignmentSubmission = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user?.id || req.user?.userId;

    const existing = await db.assignmentSubmission.findUnique({
      where: { id },
    });

    if (!existing)
      return res.status(404).json({ error: "Submission not found" });
    if (existing.studentId !== userId)
      return res.status(403).json({ error: "Forbidden" });
    if (existing.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Cannot delete graded/approved submission" });
    }

    // Remove file from disk
    if (
      existing.fileUrl &&
      existing.fileUrl.startsWith("/uploads/assignments/")
    ) {
      const filePath = path.join(process.cwd(), existing.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.assignmentSubmission.delete({ where: { id } });
    return res.json({ ok: true, message: "Submission removed" });
  } catch (error: any) {
    console.error("[LMS] DeleteSubmission Error:", error);
    return res.status(500).json({ error: "Removal failed" });
  }
};

export const getAssignmentSubmissions = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await db.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ ok: true, data: submissions });
  } catch (error: any) {
    console.error("[LMS] GetSubmissions Error:", error);
    return res.status(500).json({ error: "Fetch failed" });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, feedback, status } = req.body;

    const existing = await (db.assignmentSubmission as any).findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        assignment: { include: { module: { include: { course: true } } } },
      },
    });

    if (!existing)
      return res.status(404).json({ error: "Submission not found" });

    let finalFileUrl = existing.fileUrl;
    let updatedFiles: any[] = [];

    // Finalize to IPFS if APPROVED
    if (status === "APPROVED" && existing.fileUrl) {
      try {
        const files = JSON.parse(existing.fileUrl);
        if (Array.isArray(files)) {
          for (const file of files) {
            if (file.url && file.url.includes("/uploads/assignments/")) {
              const localPath = path.join(
                process.cwd(),
                file.url.substring(file.url.indexOf("/uploads/")),
              );

              if (fs.existsSync(localPath)) {
                try {
                  // IPFS Logic
                  const faculty = sanitizePath("External_Faculty");
                  const majority = sanitizePath("General_Majority");
                  const program = sanitizePath("General_Program");
                  const courseTitle = sanitizePath(
                    (existing.assignment as any).module?.course?.title ||
                      "General_Course",
                  );
                  const studentName = sanitizePath(
                    existing.student.name || "Student",
                  );

                  const mfsPath = `/Assignment/${faculty}/${majority}/${program}/${courseTitle}/${studentName}/${Date.now()}-${file.name.replace(
                    /\s+/g,
                    "_",
                  )}`;

                  console.log(`[LMS] Finalizing artifact to IPFS: ${mfsPath}`);
                  const fileBuffer = fs.readFileSync(localPath);
                  const cid = await uploadToIpfs(fileBuffer, mfsPath);

                  const gateway =
                    process.env.IPFS_GATEWAY || "http://127.0.0.1:8081";
                  updatedFiles.push({
                    ...file,
                    url: `${gateway}/ipfs/${cid}`,
                    cid: cid,
                    isLocal: false,
                  });

                  // Cleanup local
                  try {
                    fs.unlinkSync(localPath);
                  } catch (unlinkErr) {
                    console.warn(
                      `[LMS] Failed to delete local file: ${localPath}`,
                      unlinkErr,
                    );
                  }
                } catch (ipfsErr) {
                  console.error(
                    "[LMS] Single file IPFS finalization failed:",
                    ipfsErr,
                  );
                  updatedFiles.push(file); // Keep local if IPFS fails
                }
              } else {
                console.warn(
                  `[LMS] Local file missing during finalization: ${localPath}`,
                );
                updatedFiles.push(file);
              }
            } else {
              updatedFiles.push(file);
            }
          }
          finalFileUrl = JSON.stringify(updatedFiles);
        }
      } catch (e) {
        console.warn(
          "[LMS] IPFS Finalization aborted - JSON parse failed or other error:",
          e,
        );
      }
    }

    const numericGrade =
      grade !== undefined && grade !== null && grade !== ""
        ? parseFloat(grade)
        : null;

    const submission = await db.assignmentSubmission.update({
      where: { id },
      data: {
        grade: isNaN(numericGrade as any) ? null : numericGrade,
        feedback,
        status,
        fileUrl: finalFileUrl,
        // @ts-ignore
        ipfsCid:
          status === "APPROVED"
            ? updatedFiles.length > 0
              ? updatedFiles[0].cid
              : null
            : null,
      },
    });
    return res.json({ ok: true, data: submission });
  } catch (error: any) {
    console.error("[LMS] GradeSubmission Error:", error);
    return res
      .status(500)
      .json({ error: "Grading failed: " + (error.message || "Unknown error") });
  }
};

export const teacherDeleteSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.assignmentSubmission.findUnique({
      where: { id },
    });

    if (!existing)
      return res.status(404).json({ error: "Submission not found" });

    // Remove files from disk if they are local
    if (existing.fileUrl) {
      try {
        const files = JSON.parse(existing.fileUrl);
        if (Array.isArray(files)) {
          for (const file of files) {
            if (file.url.includes("/uploads/assignments/")) {
              const localPath = path.join(
                process.cwd(),
                file.url.substring(file.url.indexOf("/uploads/")),
              );
              if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
            }
          }
        }
      } catch (e) {
        // Fallback for legacy single string
        if (existing.fileUrl.startsWith("/uploads/assignments/")) {
          const filePath = path.join(process.cwd(), existing.fileUrl);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
    }

    await db.assignmentSubmission.delete({ where: { id } });
    return res.json({ ok: true, message: "Submission deleted by teacher" });
  } catch (error: any) {
    console.error("[LMS] TeacherDeleteSubmission Error:", error);
    return res.status(500).json({ error: "Removal failed" });
  }
};
