// backend/src/controllers/userController.ts
import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const {
      role, // "student" | "teacher"
      search, // matches name, email, nim, or nip
      program, // exact match
      majority, // exact match
      sortBy, // "name" | "nim" | "majority" | "program" | "createdAt"
      sortOrder, // "asc" | "desc"
    } = req.query;

    const whereClause: Prisma.UserWhereInput = {};

    // 1. Role Filter
    if (role) {
      whereClause.role = String(role);
    }

    // 2. Search Filter (Multi-field)
    if (search) {
      const searchStr = String(search);
      whereClause.OR = [
        { name: { contains: searchStr, mode: "insensitive" } },
        { email: { contains: searchStr, mode: "insensitive" } },
        { nim: { contains: searchStr } }, // Case sensitive biasanya untuk ID/Code
        { nip: { contains: searchStr } },
      ];
    }

    // 3. Exact MAtch Filters (Updated to Partial/Contains for flexibility with departments.ts)
    if (program) {
      whereClause.studyProgram = { contains: String(program) };
    }
    if (majority) {
      whereClause.majority = { contains: String(majority) };
    }

    // 4. Sorting
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" }; // Default

    if (sortBy) {
      const order = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
      const field = String(sortBy);

      // Mapping sortBy ke field Prisma
      if (field === "name") orderBy = { name: order };
      else if (field === "nim") orderBy = { nim: order };
      else if (field === "majority") orderBy = { majority: order };
      else if (field === "program" || field === "studyProgram")
        orderBy = { studyProgram: order };
      else if (field === "createdAt") orderBy = { createdAt: order };
      else if (field === "status" || field === "isActive")
        orderBy = { isActive: order }; // Support Status sorting
    }

    // 5. Execute Query
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nim: true,
        nip: true,
        majority: true,
        studyProgram: true,
        createdAt: true,
        avatar: true, // Fix: Include avatar in response
        isActive: true, // Needed for status
        isVerified: true, // Needed for auth button toggle
        updatedAt: true, // Needed for offline duration proxy
      },
    });

    res.json({ ok: true, data: users });
  } catch (error: any) {
    console.error("Get Users Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// PUT /profile - Update Profile
export const updateUserProfile = async (req: Request, res: Response) => {
  console.log("\n========== DEBUG UPDATE PROFILE =========="); // LOG 1
  try {
    const userId = (req as any).user.id || (req as any).user.userId;

    // 1. CEK APAKAH REQUEST MEMBAWA FILE?
    console.log("Headers:", req.headers["content-type"]); // LOG 2
    console.log("Req.file:", req.file); // LOG 3: INI KUNCINYA. Jika undefined, berarti Multer bermasalah.

    const { name, bio, personalEmail } = req.body;
    const file = req.file;

    const updateData: any = {};

    // 2. Allow Text Updates
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (personalEmail) updateData.personalEmail = personalEmail;

    // 3. Handle Avatar Logic
    if (file) {
      // FIX PATH: Pastikan path sesuai dengan struktur folder fisik (uploads/users)
      // Gunakan '/uploads/users/' agar sesuai dengan static serving
      updateData.avatar = `/uploads/users/${file.filename}`;

      console.log(">> Mengupdate Avatar ke path:", updateData.avatar);
    } else {
      // DETEKSI SILENT FAILURE
      // Jika header ada 'multipart', tapi file kosong, beri peringatan di terminal
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        console.warn(
          "⚠️ PERINGATAN: Header multipart terdeteksi tapi req.file KOSONG/UNDEFINED!"
        );
        console.warn(
          "   Kemungkinan: Field name di Frontend bukan 'avatar', atau Middleware Multer belum terpasang."
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        personalEmail: true,
        bio: true,
        avatar: true, // Pastikan field ini terpilih
        role: true,
        nim: true,
        nip: true,
        majority: true,
        studyProgram: true,
      },
    });

    console.log(">> DB Update Success. Avatar field:", updatedUser.avatar);
    console.log("==========================================\n");

    res.json({ ok: true, data: updatedUser, user: updatedUser });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
