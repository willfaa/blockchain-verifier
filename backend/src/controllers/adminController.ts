// @ts-nocheck
import { Request, Response } from "express";
import { db } from "../config/db";
import bcrypt from "bcryptjs";
import { generateCertificateImage } from "../services/imageGenerator";
import path from "path";

/**
 * SAFETY GUARD: Ensures only one response is sent per request.
 * Prevents "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client"
 */
const safeResponse = (res: Response, status: number, data: any) => {
  if (res.headersSent) {
    console.warn(
      "[SafeResponse] Attempted to send headers twice. Execution blocked."
    );
    return;
  }
  return res.status(status).json(data);
};

// 1. Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      pendingTeachers,
      totalCourses,
      totalCertificates,
      recentActivity,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          role: { equals: "TEACHER", mode: "insensitive" },
          isVerified: false,
        },
      }),
      db.course.count(),
      db.certificate.count(),
      db.certificate.findMany({
        take: 5,
        orderBy: { issuedAt: "desc" },
        select: {
          id: true,
          studentName: true,
          hash: true,
          issuedAt: true,
          program: true,
        },
      }),
    ]);

    // Perform live health checks
    const axios = require("axios");
    
    // Check DB
    let isDbOnline = false;
    try {
      await db.$queryRaw`SELECT 1`;
      isDbOnline = true;
    } catch (e: any) {
      console.warn("DB Health check failed:", e.message);
    }

    // Check IPFS (Kubo Local or Pinata Remote Gateway Backup)
    let isIpfsOnline = false;
    const ipfsApi = process.env.IPFS_API || "http://127.0.0.1:5001";
    try {
      const ipfsRes = await axios.get(`${ipfsApi}/api/v0/version`, { timeout: 1000 });
      if (ipfsRes.status === 200) {
        isIpfsOnline = true;
      }
    } catch (e) {
      // Local Kubo Offline
    }

    if (!isIpfsOnline && process.env.PINATA_JWT) {
      try {
        const pinataRes = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
          timeout: 2000,
        });
        if (pinataRes.status === 200) {
          isIpfsOnline = true;
        }
      } catch (e) {
        // Pinata Offline
      }
    }

    // Check Fabric
    let isFabricOnline = false;
    if (process.env.FABRIC_ENABLED === "true") {
      try {
        const { checkFabricReady } = require("../fabric/client");
        await checkFabricReady("admin", "admin");
        isFabricOnline = true;
      } catch (e) {
        // Offline
      }
    }

    return safeResponse(res, 200, {
      ok: true,
      stats: {
        totalUsers,
        pendingTeachers,
        totalCertificates,
        totalCourses,
      },
      system: {
        dbPort: process.env.DB_PORT || "5432",
        ipfsApi: process.env.IPFS_API || "http://127.0.0.1:5001",
        ipfsGateway: process.env.IPFS_GATEWAY || "http://127.0.0.1:8081",
        fabricEnabled: process.env.FABRIC_ENABLED === "true",
        uptime: Math.floor(process.uptime()),
        health: {
          database: isDbOnline ? "ONLINE" : "OFFLINE",
          ipfs: isIpfsOnline ? "ONLINE" : "OFFLINE",
          blockchain: isFabricOnline ? "ONLINE" : "OFFLINE",
          backend: "ONLINE",
          frontend: "ONLINE"
        }
      },
      recentActivity,
    });
  } catch (error: any) {
    console.error("[DashboardStats Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch dashboard stats" });
  }
};

// 2. Pending Users
export const getPendingUsers = async (req: Request, res: Response) => {
  try {
    const users = await db.user.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        majority: true,
        studyProgram: true,
        avatar: true,
      },
    });

    return safeResponse(res, 200, { ok: true, data: users });
  } catch (error: any) {
    console.error("[PendingUsers Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch pending users" });
  }
};

// 3. Active Users (STRICT ALIGNMENT VERSION)
export const getActiveUsers = async (req: Request, res: Response) => {
  try {
    console.log(">>> [ADMIN] getActiveUsers - Query Params:", req.query);

    const { role, search, majority, program, sortBy, sortOrder } = req.query;
    const whereClause: any = { isApproved: true };

    // --- ROLE FILTERING ---
    if (role && typeof role === "string") {
      const normalizedRole = role.toUpperCase();
      // If "ALL", we don't apply a role filter
      if (normalizedRole !== "ALL") {
        // Map Plural to Singular
        const roleMap: Record<string, string> = {
          ADMINS: "ADMIN",
          STUDENTS: "STUDENT",
          TEACHERS: "TEACHER",
        };
        const mappedRole = roleMap[normalizedRole] || normalizedRole;

        // Since schema.prisma defines role as a String (not Enum), we can use insensitive matching
        whereClause.role = {
          equals: mappedRole,
          mode: "insensitive",
        };
      }
    }

    // --- OTHER FILTERS ---
    if (majority && majority !== "All Majors")
      whereClause.majority = String(majority);
    if (program && program !== "All Programs")
      whereClause.studyProgram = String(program);

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
        { studentId: { contains: String(search), mode: "insensitive" } },
        { nip: { contains: String(search), mode: "insensitive" } },
      ];
    }

    // --- SORTING (Fix Prisma error: Unknown argument 'status') ---
    let sortField = String(sortBy || "createdAt");

    // Map Frontend names to Prisma Schema names
    if (sortField === "status") sortField = "isActive";
    if (sortField === "verified") sortField = "isVerified";

    const allowedSortFields = [
      "name",
      "email",
      "role",
      "createdAt",
      "isActive",
      "isVerified",
      "majority",
      "studyProgram",
      "studentId",
      "nip",
    ];

    if (!allowedSortFields.includes(sortField)) {
      console.warn(
        `[Sorting] Invalid field '${sortField}' requested. Falling back to 'createdAt'.`
      );
      sortField = "createdAt";
    }

    const orderBy = {
      [sortField]: String(sortOrder) === "desc" ? "desc" : "asc",
    };

    const users = await db.user.findMany({
      where: whereClause,
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isVerified: true,
        isActive: true,
        majority: true,
        studyProgram: true,
        avatar: true,
        studentId: true,
        nip: true,
      },
    });

    console.log(
      `<<< [ADMIN] getActiveUsers - Results: ${users.length} users found.`
    );
    return safeResponse(res, 200, { ok: true, data: users });
  } catch (error: any) {
    console.error("[ActiveUsers Error]", error.message);
    return safeResponse(res, 500, {
      error: `Database error: ${error.message}`,
    });
  }
};

// 4. Get User By ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isVerified: true,
        isActive: true,
        majority: true,
        studyProgram: true,
        avatar: true,
        studentId: true,
        nip: true,
        personalEmail: true,
        isApproved: true,
      },
    });

    if (!user) {
      return safeResponse(res, 404, { error: "User not found" });
    }

    return safeResponse(res, 200, { ok: true, data: user });
  } catch (error: any) {
    console.error("[GetUserById Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch user details" });
  }
};

// --- USER ACTIONS ---

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isApproved: true },
    });
    return safeResponse(res, 200, {
      message: "User approved successfully",
      user: updated,
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to approve user" });
  }
};

export const verifyTeacher = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    return safeResponse(res, 200, {
      message: "Teacher verified",
      user: updated,
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Verification failed" });
  }
};

export const unverifyUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isVerified: false },
    });
    return safeResponse(res, 200, {
      message: "Teacher unverified",
      user: updated,
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Unverify failed" });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return safeResponse(res, 200, { message: "User banned", user: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Ban failed" });
  }
};

export const unbanUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    return safeResponse(res, 200, { message: "User unbanned", user: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Unban failed" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentAdminId = req.user?.id;

    if (currentAdminId === userId) {
      return safeResponse(res, 400, { error: "Cannot delete self" });
    }

    await db.user.delete({ where: { id: userId } });
    return safeResponse(res, 200, { message: "User deleted" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Deletion failed" });
  }
};

// --- BULK ---
export const bulkCreateUsers = async (req: Request, res: Response) => {
  try {
    const { users, defaultPassword } = req.body;
    if (!users || !Array.isArray(users))
      return safeResponse(res, 400, { error: "Invalid data" });

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const results = await Promise.all(
      users.map(async (u) => {
        try {
          const { studentId, ...rest } = u;
          await db.user.create({
            data: {
              ...rest,
              password: hashedPassword,
              isApproved: true,
              isActive: true,
              // Handle optional fields mapping studentId
              studentId: u.role === "STUDENT" ? (studentId || null) : null,
              nip: u.role === "TEACHER" ? u.nip : null,
            },
          });
          return { email: u.email, status: "ok" };
        } catch (e: any) {
          return { email: u.email, status: "error", message: e.message };
        }
      })
    );

    return safeResponse(res, 200, { ok: true, results });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Bulk import failed" });
  }
};

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    const layoutSetting = await db.systemSetting.findUnique({
      where: { key: "certificate_layout" },
    });
    return safeResponse(res, 200, {
      ok: true,
      settings: {
        certificateLayout: layoutSetting?.value || "HORIZONTAL",
      },
    });
  } catch (error: any) {
    console.error("[GetSystemSettings Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to fetch settings" });
  }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { certificateLayout } = req.body;
    if (!certificateLayout || !["HORIZONTAL", "VERTICAL"].includes(certificateLayout)) {
      return safeResponse(res, 400, { error: "Invalid layout value. Must be HORIZONTAL or VERTICAL" });
    }

    const updated = await db.systemSetting.upsert({
      where: { key: "certificate_layout" },
      update: { value: certificateLayout },
      create: { key: "certificate_layout", value: certificateLayout },
    });

    return safeResponse(res, 200, {
      ok: true,
      message: "Settings updated successfully",
      settings: {
        certificateLayout: updated.value,
      },
    });
  } catch (error: any) {
    console.error("[UpdateSystemSettings Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to update settings" });
  }
};

// 1. Admin Course Management
export const getAdminCourses = async (req: Request, res: Response) => {
  try {
    const courses = await db.course.findMany({
      include: {
        user: true,
        category: true
      },
      orderBy: { createdAt: "desc" }
    });
    return safeResponse(res, 200, { ok: true, data: courses });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to fetch admin courses" });
  }
};

export const getAdminCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await db.course.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!course) return safeResponse(res, 404, { error: "Course not found" });
    return safeResponse(res, 200, { ok: true, data: course });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to fetch course details" });
  }
};

export const updateAdminCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, categoryId, allowedPrograms } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (allowedPrograms !== undefined) {
      try {
        updateData.allowedPrograms = typeof allowedPrograms === "string" ? JSON.parse(allowedPrograms) : allowedPrograms;
      } catch (e) {
        updateData.allowedPrograms = allowedPrograms;
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files["thumbnail"] && files["thumbnail"][0]) {
        updateData.imageUrl = `/uploads/courses/${req.user.id}/${files["thumbnail"][0].filename}`;
      }
      if (files["certificateTemplate"] && files["certificateTemplate"][0]) {
        updateData.certificateTemplate = `/uploads/courses/${req.user.id}/${files["certificateTemplate"][0].filename}`;
      }
    }

    const updated = await db.course.update({
      where: { id },
      data: updateData
    });

    return safeResponse(res, 200, { ok: true, message: "Course updated successfully", data: updated });
  } catch (error: any) {
    console.error("[updateAdminCourse Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to update course" });
  }
};

export const deleteAdminCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.course.delete({ where: { id } });
    return safeResponse(res, 200, { ok: true, message: "Course deleted successfully" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to delete course" });
  }
};

// 2. Certificate Template settings
export const getCertificateDetails = async (req: Request, res: Response) => {
  try {
    const [nameSetting, nipSetting, templateSetting] = await Promise.all([
      db.systemSetting.findUnique({ where: { key: "default_certificate_instructor_name" } }),
      db.systemSetting.findUnique({ where: { key: "default_certificate_instructor_nip" } }),
      db.systemSetting.findUnique({ where: { key: "default_certificate_template" } }),
    ]);

    return safeResponse(res, 200, {
      ok: true,
      data: {
        instructorName: nameSetting?.value || "Budi Headmaster, M.T.",
        instructorNip: nipSetting?.value || "198706152010121002",
        certificateTemplate: templateSetting?.value || null,
      }
    });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to fetch certificate settings" });
  }
};

export const updateCertificateDetails = async (req: Request, res: Response) => {
  try {
    const { instructorName, instructorNip } = req.body;
    
    if (instructorName !== undefined) {
      await db.systemSetting.upsert({
        where: { key: "default_certificate_instructor_name" },
        update: { value: instructorName },
        create: { key: "default_certificate_instructor_name", value: instructorName }
      });
    }

    if (instructorNip !== undefined) {
      await db.systemSetting.upsert({
        where: { key: "default_certificate_instructor_nip" },
        update: { value: instructorNip },
        create: { key: "default_certificate_instructor_nip", value: instructorNip }
      });
    }

    return safeResponse(res, 200, { ok: true, message: "Certificate details updated successfully" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to update certificate details" });
  }
};

export const updateCertificateTemplateBackground = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let templatePath = "";

    if (files && files["certificateTemplate"] && files["certificateTemplate"][0]) {
      templatePath = `/uploads/courses/${req.user.id}/${files["certificateTemplate"][0].filename}`;
    } else if (req.file) {
      templatePath = `/uploads/courses/${req.user.id}/${req.file.filename}`;
    } else {
      return safeResponse(res, 400, { error: "No image file provided" });
    }

    await db.systemSetting.upsert({
      where: { key: "default_certificate_template" },
      update: { value: templatePath },
      create: { key: "default_certificate_template", value: templatePath }
    });

    return safeResponse(res, 200, {
      ok: true,
      message: "Default template background updated successfully",
      path: templatePath
    });
  } catch (error: any) {
    console.error("[updateCertificateTemplateBackground Error]", error.message);
    return safeResponse(res, 500, { error: "Failed to update template background" });
  }
};

export const getCertificateTemplatePreview = async (req: Request, res: Response) => {
  try {
    const layoutSetting = await db.systemSetting.findUnique({
      where: { key: "certificate_layout" },
    });
    const layout = (layoutSetting?.value as "HORIZONTAL" | "VERTICAL") || "HORIZONTAL";

    const nameSetting = await db.systemSetting.findUnique({ where: { key: "default_certificate_instructor_name" } });
    const nipSetting = await db.systemSetting.findUnique({ where: { key: "default_certificate_instructor_nip" } });
    const templateSetting = await db.systemSetting.findUnique({ where: { key: "default_certificate_template" } });

    const issuedAt = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());

    const previewData = {
      name: "STUDENT NAME",
      studentId: "usr-9a8b7c6d-5e4f-3a2b",
      courseName: "DEMO COURSE TITLE",
      majority: "Teknologi Informasi",
      program: "Rekayasa Perangkat Lunak",
      certId: "cert-00000000-0000-0000-0000-000000000000",
      issuedAt,
      issuerId: req.user?.id || "ADMIN",
      instructorName: nameSetting?.value || "Budi Headmaster, M.T.",
      instructorNip: nipSetting?.value || "198706152010121002",
      instructorMajor: "Teknologi Informasi",
      layout,
      customTemplatePath: templateSetting?.value ? path.join(process.cwd(), templateSetting.value) : undefined
    };

    const imgBuffer = await generateCertificateImage(previewData);
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(imgBuffer);
  } catch (error: any) {
    console.error("[getCertificateTemplatePreview Error]", error.message);
    return res.status(500).json({ error: "Failed to render certificate preview" });
  }
};

// 3. Bidang Keahlian CRUD
export const getBidangList = async (req: Request, res: Response) => {
  try {
    const data = await db.bidangKeahlian.findMany({ orderBy: { name: "asc" } });
    return safeResponse(res, 200, { ok: true, data });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to fetch fields" });
  }
};

export const createBidang = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return safeResponse(res, 400, { error: "Name is required" });
    const created = await db.bidangKeahlian.create({ data: { name } });
    return safeResponse(res, 201, { ok: true, data: created });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to create field" });
  }
};

export const updateBidang = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return safeResponse(res, 400, { error: "Name is required" });
    const updated = await db.bidangKeahlian.update({
      where: { id },
      data: { name }
    });
    return safeResponse(res, 200, { ok: true, data: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to update field" });
  }
};

export const deleteBidang = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.bidangKeahlian.delete({ where: { id } });
    return safeResponse(res, 200, { ok: true, message: "Field deleted successfully" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to delete field" });
  }
};

// 4. Program Keahlian CRUD
export const getProgramList = async (req: Request, res: Response) => {
  try {
    const data = await db.programKeahlian.findMany({
      include: { bidangKeahlian: true },
      orderBy: { name: "asc" }
    });
    return safeResponse(res, 200, { ok: true, data });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to fetch programs" });
  }
};

export const createProgram = async (req: Request, res: Response) => {
  try {
    const { name, bidangKeahlianId } = req.body;
    if (!name || !bidangKeahlianId) return safeResponse(res, 400, { error: "Name and Bidang ID are required" });
    const created = await db.programKeahlian.create({
      data: { name, bidangKeahlianId }
    });
    return safeResponse(res, 201, { ok: true, data: created });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to create program" });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, bidangKeahlianId } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bidangKeahlianId !== undefined) updateData.bidangKeahlianId = bidangKeahlianId;
    const updated = await db.programKeahlian.update({
      where: { id },
      data: updateData
    });
    return safeResponse(res, 200, { ok: true, data: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to update program" });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.programKeahlian.delete({ where: { id } });
    return safeResponse(res, 200, { ok: true, message: "Program deleted successfully" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to delete program" });
  }
};

// 5. Konsentrasi Keahlian CRUD
export const getKonsentrasiList = async (req: Request, res: Response) => {
  try {
    const data = await db.konsentrasiKeahlian.findMany({
      include: { programKeahlian: { include: { bidangKeahlian: true } } },
      orderBy: { name: "asc" }
    });
    return safeResponse(res, 200, { ok: true, data });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to fetch concentrations" });
  }
};

export const createKonsentrasi = async (req: Request, res: Response) => {
  try {
    const { name, programKeahlianId } = req.body;
    if (!name || !programKeahlianId) return safeResponse(res, 400, { error: "Name and Program ID are required" });
    const created = await db.konsentrasiKeahlian.create({
      data: { name, programKeahlianId }
    });
    return safeResponse(res, 201, { ok: true, data: created });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to create concentration" });
  }
};

export const updateKonsentrasi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, programKeahlianId } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (programKeahlianId !== undefined) updateData.programKeahlianId = programKeahlianId;
    const updated = await db.konsentrasiKeahlian.update({
      where: { id },
      data: updateData
    });
    return safeResponse(res, 200, { ok: true, data: updated });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to update concentration" });
  }
};

export const deleteKonsentrasi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.konsentrasiKeahlian.delete({ where: { id } });
    return safeResponse(res, 200, { ok: true, message: "Concentration deleted successfully" });
  } catch (error: any) {
    return safeResponse(res, 500, { error: "Failed to delete concentration" });
  }
};
