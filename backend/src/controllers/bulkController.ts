import { Request, Response } from "express";
import { db } from "../config/db";
import * as xlsx from "xlsx";
import * as bcrypt from "bcryptjs";

// --- HELPERS ---
const bufferToExcel = (data: any[], sheetName: string): Buffer => {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

const excelToJSON = (buffer: Buffer) => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(ws);
};

// --- USER MANAGEMENT ---

export const downloadUserTemplate = async (req: Request, res: Response) => {
  try {
    const data = [
      {
        Name: "John Doe",
        Email: "john@example.com",
        Role: "student",
        Password: "password123",
      },
      {
        Name: "Jane Teacher",
        Email: "jane@example.com",
        Role: "teacher",
        Password: "securePass!",
      },
    ];
    const buffer = bufferToExcel(data, "Users Template");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="users_template.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const importUsers = async (req: Request, res: Response) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "No file uploaded" });

    const { defaultPassword } = req.body;
    const users: any[] = excelToJSON(req.file.buffer);

    let successCount = 0;
    let failCount = 0;

    for (const row of users) {
      try {
        const email = row.Email;
        const name = row.Name || "Unknown";
        const role = (row.Role || "student").toLowerCase();
        const rawPassword = row.Password || defaultPassword || "default123";

        if (!email) continue;

        const hashedPassword = await bcrypt.hash(String(rawPassword), 10);

        // Uses upsert to update existing or create new
        await db.user.upsert({
          where: { email },
          update: {
            name,
            role,
            isApproved: true, // Auto-approve imported users
          },
          create: {
            email,
            name,
            password: hashedPassword,
            role,
            isApproved: true, // Auto-approve
            isVerified: true,
          },
        });
        successCount++;
      } catch (err) {
        console.error("Import User Error:", err);
        failCount++;
      }
    }

    res.json({
      ok: true,
      message: `Imported ${successCount} users. Failed: ${failCount}`,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const exportUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    });

    // Format for Excel
    const data = users.map((u) => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Approved: u.isApproved ? "Yes" : "No",
      JoinedAt: u.createdAt.toISOString().split("T")[0],
    }));

    const buffer = bufferToExcel(data, "All Users");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="all_users.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// --- COURSE STRUCTURE ---

export const downloadCourseTemplate = async (req: Request, res: Response) => {
  try {
    const data = [
      {
        "Course Title": "Intro to Blockchain",
        "Module Title": "Module 1: Basics",
        "Lesson Title": "What is Bitcoin?",
        "Video URL": "https://video.com/123",
        Description: "Introduction video",
      },
      {
        "Course Title": "Intro to Blockchain",
        "Module Title": "Module 1: Basics",
        "Lesson Title": "Mining Explained",
        "Video URL": "",
        Description: "",
      },
    ];
    const buffer = bufferToExcel(data, "Course Structure");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="course_template.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

export const importCourseStructure = async (req: Request, res: Response) => {
  try {
    if (!req.file)
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    const { teacherId } = req.body;

    if (!teacherId)
      return res.status(400).json({ ok: false, error: "Teacher ID required" });

    const rows: any[] = excelToJSON(req.file.buffer);

    // Logic: Group by Course -> Module -> Data
    // We'll iterate row by row and maintain context or just simple find/create calls.
    // Simple find/create is slower but safer for consistency.

    let createdCourses = 0;
    let createdModules = 0;
    let createdLessons = 0;

    for (const row of rows) {
      const courseTitle = row["Course Title"];
      const moduleTitle = row["Module Title"];
      const lessonTitle = row["Lesson Title"];
      const videoUrl = row["Video URL"];
      const description = row["Description"];

      if (!courseTitle || !moduleTitle || !lessonTitle) continue;

      // 1. Find or Create Course
      // Note: We scope by teacherId so different teachers can have courses with same name?
      // Or global? Let's assume unique Title for simplicity or just duplicates allowed.
      // Usually Title + Teacher is the key.
      // Using findFirst to avoid duplicates for THIS teacher.
      let course = await db.course.findFirst({
        where: { title: courseTitle, userId: teacherId },
      });

      if (!course) {
        course = await db.course.create({
          data: {
            title: courseTitle,
            userId: teacherId,
            isPublished: true, // Default
          },
        });
        createdCourses++;
      }

      // 2. Find or Create Module
      let moduleData = await db.module.findFirst({
        where: { title: moduleTitle, courseId: course.id },
      });

      if (!moduleData) {
        // Calculate position
        const count = await db.module.count({ where: { courseId: course.id } });
        moduleData = await db.module.create({
          data: {
            title: moduleTitle,
            courseId: course.id,
            position: count + 1,
            isPublished: true,
          },
        });
        createdModules++;
      }

      // 3. Create Lesson (Always create? Or prevent dupe?)
      // Let's prevent duplicate lesson names in same module
      const existingLesson = await db.lesson.findFirst({
        where: { title: lessonTitle, moduleId: moduleData.id },
      });

      if (!existingLesson) {
        const lessonCount = await db.lesson.count({
          where: { moduleId: moduleData.id },
        });
        await db.lesson.create({
          data: {
            title: lessonTitle,
            moduleId: moduleData.id,
            videoUrl: videoUrl || null,
            description: description || null,
            position: lessonCount + 1,
            isPublished: true,
          },
        });
        createdLessons++;
      }
    }

    res.json({
      ok: true,
      message: `Import complete.`,
      stats: { createdCourses, createdModules, createdLessons },
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
