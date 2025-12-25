import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { enrollCourse } from "../repositories/userRepo";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const createCourse = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      teacherId,
      category,
      studyProgram,
      targetAudience,
      allowedPrograms,
    } = req.body;

    const fileName = req.file?.filename;
    // Note: teacherId should match req.user.id roughly, assuming creator is user.
    // However, here we might not have easy access to req.user if it wasn't passed or casted.
    // Ideally we use the same userId logic as middleware: req.user.id || 'anonymous'
    const userId =
      (req as any).user?.id || (req as any).user?.userId || "anonymous";

    // ENFORCEMENT: Check Verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });
    if (!user || (!user.isVerified && (req as any).user.role === "teacher")) {
      return res.status(403).json({
        ok: false,
        error: "Your account is not verified. Please contact Admin.",
      });
    }
    const thumbnailPath = fileName
      ? `/uploads/courses/${userId}/${fileName}`
      : null;

    let programs = allowedPrograms;
    if (typeof allowedPrograms === "string") {
      try {
        programs = JSON.parse(allowedPrograms);
      } catch (e) {
        programs = [];
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        category,
        studyProgram,
        targetAudience,
        allowedPrograms: programs || [],
        thumbnail: thumbnailPath,
        teacherId,
        isPublished: false, // Default pending/draft
      },
    });

    res.status(201).json({ ok: true, course });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 1.2 Get Course Outline (Nested Chapters & Lessons)
export const getCourseOutline = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const chapters = await prisma.chapter.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });
    res.json({ ok: true, data: chapters });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 1.5 Update Course (Basic Info & Publishing)
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      studyProgram,
      targetAudience,
      allowedPrograms,
      isPublished,
    } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (studyProgram) updateData.studyProgram = studyProgram;
    if (targetAudience) updateData.targetAudience = targetAudience;

    // Fix: Robust handling for allowedPrograms
    if (allowedPrograms !== undefined) {
      let programs: string[] = [];

      console.log(
        "Raw allowedPrograms:",
        allowedPrograms,
        typeof allowedPrograms
      );

      if (typeof allowedPrograms === "string") {
        try {
          // Handle case where it might be double-stringified or simple string
          if (allowedPrograms.startsWith("[")) {
            programs = JSON.parse(allowedPrograms);
          } else {
            // If it's just a single string not in JSON array format?
            // Assume unexpected format or comma separated?
            // For safety, parsing JSON is primary.
            programs = JSON.parse(allowedPrograms);
          }
        } catch (e) {
          console.error("Error parsing allowedPrograms:", e);
          programs = [];
        }
      } else if (Array.isArray(allowedPrograms)) {
        programs = allowedPrograms.map(String);
      }

      updateData.allowedPrograms = programs;
    }

    // Handle Publish Logic with Validation
    // Validasi Publish
    if (isPublished !== undefined) {
      // Standardize boolean or string input
      const willPublish = String(isPublished) === "true"; // Only "true" becomes true. "false" becomes false.

      if (willPublish) {
        // Validation: Verify course has content ONLY if we are PUBLISHING
        const courseWithContent = await prisma.course.findUnique({
          where: { id },
          include: {
            chapters: {
              include: { lessons: true },
            },
          },
        });

        if (!courseWithContent)
          return res.status(404).json({ ok: false, error: "Course not found" });

        const hasContent = courseWithContent.chapters.some(
          (ch) => ch.lessons.length > 0
        );
        if (!hasContent) {
          return res.status(400).json({
            ok: false,
            error:
              "Course must have at least one chapter with lessons to be published.",
          });
        }
      }

      updateData.isPublished = willPublish;
    }

    if (req.file) {
      const userId =
        (req as any).user?.id || (req as any).user?.userId || "anonymous";

      // --- DELETE OLD THUMBNAIL LOGIC ---
      try {
        const oldCourse = await prisma.course.findUnique({
          where: { id },
          select: { thumbnail: true },
        });

        if (
          oldCourse?.thumbnail &&
          !oldCourse.thumbnail.includes("default") &&
          !oldCourse.thumbnail.includes("placeholder")
        ) {
          const relativeDbPath = oldCourse.thumbnail.startsWith("/")
            ? oldCourse.thumbnail.substring(1)
            : oldCourse.thumbnail;
          // Relative to src/controllers -> ../../
          const oldPath = path.join(__dirname, "../../", relativeDbPath);

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log("Deleted old thumbnail:", oldPath);
          }
        }
      } catch (delErr) {
        console.error("Failed to delete old thumbnail:", delErr);
      }
      // ----------------------------------

      updateData.thumbnail = `/uploads/courses/${userId}/${req.file.filename}`;
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    });

    res.json({ ok: true, data: course });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 2. Add Lesson (Now inside Chapter)
export const addLesson = async (req: Request, res: Response) => {
  try {
    const { title, content, chapterId, order } = req.body;

    if (!chapterId) {
      return res
        .status(400)
        .json({ ok: false, error: "Chapter ID is required" });
    }

    // Validasi file video
    // Note: Video file is optional IF content is present, but let's stick to previous logic or relax it.
    // Previous logic: "video file is required for offline mode". Let's keep it but make it optional if just text lesson?
    // User request: "Video Upload/URL".
    // Let's allow optional video if it's a text lesson.

    let videoPath = null;
    if (req.file) {
      const userId =
        (req as any).user?.id || (req as any).user?.userId || "anonymous";
      videoPath = `/uploads/courses/${userId}/${req.file.filename}`;
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content, // Deskripsi teks
        videoPath, // Path ke file MP4 di laptop server
        order: parseInt(order) || 1,
        chapterId,
        isPublished: true, // Default true for now
      } as any,
    });

    res.status(201).json({ ok: true, lesson });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 2.5 Update Lesson
export const updateLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isPublished, isFreePreview } = req.body;
    const videoFile = req.file;

    const existingLesson = await prisma.lesson.findUnique({ where: { id } });
    if (!existingLesson) {
      return res.status(404).json({ ok: false, error: "Lesson not found" });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    // Handle boolean strings from FormData
    if (isPublished !== undefined)
      updateData.isPublished = String(isPublished) === "true";
    if (isFreePreview !== undefined)
      updateData.isFreePreview = String(isFreePreview) === "true";

    if (videoFile) {
      const userId =
        (req as any).user?.id || (req as any).user?.userId || "anonymous";

      // --- DELETE OLD VIDEO LOGIC ---
      try {
        // We already fetched existingLesson above
        if (
          existingLesson?.videoPath &&
          !existingLesson.videoPath.includes("default")
        ) {
          const relativeDbPath = existingLesson.videoPath.startsWith("/")
            ? existingLesson.videoPath.substring(1)
            : existingLesson.videoPath;
          const oldPath = path.join(__dirname, "../../", relativeDbPath);

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log("Deleted old video:", oldPath);
          }
        }
      } catch (delErr) {
        console.error("Failed to delete old video:", delErr);
      }
      // -----------------------------

      const videoPath = `/uploads/courses/${userId}/${videoFile.filename}`;
      updateData.videoPath = videoPath;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    res.json({ ok: true, data: updatedLesson });
  } catch (error: any) {
    console.error("Update Lesson Error:", error);
    res.status(500).json({ ok: false, error: "Failed to update lesson" });
  }
};

// 3. Get All Courses (Public Catalog)
// 3. Get All Courses (Public Catalog)
export const getCourses = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;

    const whereClause: any = {
      isPublished: true,
    };

    if (search) {
      whereClause.title = { contains: search as string, mode: "insensitive" };
    }

    if (category) {
      whereClause.category = category as string;
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            name: true,
            // avatar: true // Add if available in User model
          },
        },
        chapters: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { enrollments: true, chapters: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate lesson counts manually since it's nested
    const data = courses.map((course) => {
      const lessonCount = course.chapters.reduce(
        (acc, ch) => acc + ch._count.lessons,
        0
      );
      return {
        ...course,
        _count: {
          ...course._count,
          lessons: lessonCount,
        },
      };
    });

    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 1.6 Delete Course
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ ok: true, message: "Course deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 2.6 Get Lesson Detail
export const getLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          select: {
            courseId: true,
            course: {
              select: { teacherId: true },
            },
          },
        },
      },
    });

    if (!lesson)
      return res.status(404).json({ ok: false, error: "Lesson not found" });

    // Access Control Logic
    // If user is Admin or Owner, bypass enrollment check
    const isOwner = userId && lesson.chapter.course.teacherId === userId;
    const isAdmin = (req as any).user?.role === "admin";

    // Check enrollment if not owner/admin
    if (!isOwner && !isAdmin) {
      // Allow free preview logic based on lesson.isFreePreview
      if (!lesson.isFreePreview) {
        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: userId,
              courseId: lesson.chapter.courseId,
            },
          },
        });

        if (!enrollment) {
          return res
            .status(403)
            .json({ error: "You must enroll to view this content" });
        }
      }
    }

    res.json({ ok: true, data: lesson });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 4. Get Course Detail (Classroom View)
// 4. Get Course Detail (Public View - Only Published)
export const getPublicCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        chapters: {
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        teacher: { select: { name: true, email: true } },
        exams: {
          select: {
            id: true,
            title: true,
            isEnabled: true,
            durationMinutes: true,
          },
        },
      } as any,
    });

    if (!course) {
      return res.status(404).json({ ok: false, error: "Course not found" });
    }

    // 2. SOFT AUTH: Check if User is Enrolled & Get Progress
    let isEnrolled = false;
    let enrollmentData = null;
    let bestResult = null;

    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback_secret"
        ) as any;
        const userId = decoded.id;

        // Check enrollment with Certificate
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: userId,
              courseId: id,
            },
          },
        });

        if (enrollment) {
          isEnrolled = true;

          // Manual fetch certificate (No direct relation in schema)
          const certificate = await prisma.certificate.findFirst({
            where: {
              userId: userId,
              courseId: id,
            },
          });

          enrollmentData = {
            ...enrollment,
            certificate: certificate,
          };
        }

        // Get Exam Result if exam exists
        if (course.exams && course.exams.length > 0) {
          const examId = course.exams[0].id;
          bestResult = await prisma.examResult.findFirst({
            where: {
              examId: examId,
              studentId: userId,
            },
            orderBy: { score: "desc" },
          });
        }
      } catch (e) {
        // Ignore invalid token (treat as guest)
      }
    }

    // Flatten exams array to single 'exam' object for frontend compatibility
    const responseData = {
      ...course,
      exam: (course as any).exams?.[0] || null,
      isEnrolled,
      enrollment: enrollmentData,
      bestResult: bestResult,
    };

    res.json({
      ok: true,
      data: responseData,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 4.5 Get Course Detail (Teacher View - Drafts Allowed)
export const getTeacherCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Potentially verify teacherId matches req.user.id for security

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        chapters: {
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        teacher: { select: { name: true, email: true } },
        exams: true,
      } as any,
    });

    if (!course) {
      return res.status(404).json({ ok: false, error: "Course not found" });
    }

    res.json({ ok: true, data: course });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 4.6 Get All Courses for Teacher (Dashboard)
export const getTeacherCourses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // ENFORCEMENT
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });
    if (!user || (!user.isVerified && req.user?.role === "teacher")) {
      return res.status(403).json({
        ok: false,
        error: "Your account is not verified. Please contact Admin.",
      });
    }

    const courses = await prisma.course.findMany({
      where: {
        teacherId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: { select: { chapters: true, enrollments: true } },
      },
    });

    res.json({ ok: true, data: courses });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 5. Enroll Student (Siswa Mendaftar)
export const enrollStudent = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    // req.user.id didapat dari middleware verifyToken
    const userId = req.user?.id;

    if (!userId || !courseId) {
      return res.status(400).json({ ok: false, error: "Missing data" });
    }

    // ENFORCEMENT: Check Verification Status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVerified: true },
    });

    if (!user || !user.isVerified) {
      return res.status(403).json({
        ok: false,
        error: "Your account is not verified. Please contact Admin.",
      });
    }

    // Panggil fungsi repo yang sudah diperbaiki tadi
    const enrollment = await enrollCourse(userId, courseId);

    res.json({ ok: true, enrollment });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 6. Get Students in Course (Teacher View - With Filters support)
export const getCourseStudents = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Course ID
    // Safe access to user ID from middleware
    const userId = (req as any).user?.id || (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Verify Ownership
    const course = await prisma.course.findUnique({
      where: { id },
      select: { teacherId: true },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Allow Owner OR Admin to view students
    const userRole = (req as any).user?.role;
    if (course.teacherId !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Only the course instructor can view students." });
    }

    // 2. Fetch Enrollments with User Details
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true, // Included avatar
            studyProgram: true,
            majority: true, // Bonus: keep majority
            nim: true, // Bonus: keep nim
          } as any,
        },
      },
      orderBy: { enrolledAt: "desc" }, // CORRECTED: User schema uses enrolledAt, not createdAt for Enrollment
    });

    // 3. Format Data for Frontend
    const students = enrollments.map((e: any) => ({
      id: e.user.id,
      enrollmentId: e.id, // Important for "Kick" functionality
      name: e.user.name,
      email: e.user.email,
      avatar: e.user.avatar,
      studyProgram: e.user.studyProgram || "N/A",
      majority: e.user.majority,
      nim: e.user.nim,
      enrolledAt: e.enrolledAt,
      user: e.user, // Keep nested user object for compatibility if frontend needs it
    }));

    res.json({ ok: true, data: students });
  } catch (error: any) {
    console.error("Error in getCourseStudents:", error);
    // Return the actual error message in dev mode for easier debugging
    res
      .status(500)
      .json({ error: "Failed to fetch students", details: error.message });
  }
};

// 7. Kick Student (Remove Enrollment)
export const kickStudent = async (req: Request, res: Response) => {
  try {
    const { courseId, studentId } = req.params;
    // Security: Verify requester is owner (handled by middleware? or manual check?)
    // For now assuming verifying issuer middleware handles "Teacher" role,
    // but ideally we check if course.teacherId === req.user.id

    // We strictly delete using composite key or ID?
    // Prisma deleteMany is safer with composite WHERE
    const deleted = await prisma.enrollment.deleteMany({
      where: {
        courseId: courseId,
        userId: studentId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ ok: false, error: "Enrollment not found" });
    }

    res.json({ ok: true, message: "Student removed from course" });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 8. Approve / Reject Student (Teacher Action - Bulk Update)
export const updateEnrollmentStatus = async (req: Request, res: Response) => {
  try {
    const { enrollmentIds, status } = req.body; // status: "approved" | "rejected"

    if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "No enrollments selected" });
    }

    // Update Massal status siswa
    const result = await prisma.enrollment.updateMany({
      where: {
        id: { in: enrollmentIds },
      },
      data: {
        status: status,
      },
    });

    res.json({
      ok: true,
      message: `Successfully updated ${result.count} students to ${status}`,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// 9. Search Student by NIM (For Smart Certificate)
export const getStudentByNim = async (req: Request, res: Response) => {
  try {
    const { nim } = req.params;

    if (!nim) {
      return res.status(400).json({ ok: false, error: "NIM is required" });
    }

    const student = await prisma.user.findFirst({
      where: {
        nim: nim,
        role: "student",
      },
      select: {
        id: true,
        name: true,
        email: true,
        nim: true,
        majority: true,
        studyProgram: true, // UPDATED
      } as any,
    });

    if (!student) {
      return res.status(404).json({ ok: false, error: "Student not found" });
    }

    // Alias for frontend compatibility (Frontend expects 'program')
    const formattedStudent = {
      ...student,
      program: student.studyProgram,
    };

    res.json({ ok: true, data: formattedStudent });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
