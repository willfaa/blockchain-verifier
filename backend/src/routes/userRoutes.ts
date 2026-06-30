import express, { Request, Response } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { db } from "../config/db";
import { uploadFileToSupabase } from "../utils/supabaseStorage";
import fs from "fs";
import path from "path";

const prisma = db;
const router = express.Router();

// 0. Debug Entry Log
router.use((req, res, next) => {
  console.log(`[UserRouter] 0. Entered Router: ${req.method} ${req.path}`);
  next();
});

// THE FIX: Inline Controller Logic
router.put(
  "/profile",
  // 1. Auth MUST be first so req.user is available for Multer
  verifyToken,

  // 2. Upload (Uses req.user to create folder)
  upload.single("avatar"),

  // 3. Logic (Inline)
  async (req: Request, res: Response) => {
    console.log("---------------- UPLOAD DEBUG ----------------");
    console.log("Headers content-type:", req.headers["content-type"]);
    console.log("Req.file:", req.file);
    console.log("Req.body:", req.body);
    console.log("----------------------------------------------");

    // SAFETY CHECK: Warn if file upload was attempted but failed
    if (
      req.headers["content-type"]?.includes("multipart/form-data") &&
      !req.file
    ) {
      console.warn(
        "⚠️ WARNING: Multipart request detected but req.file is undefined."
      );
      console.warn(
        "Possible causes: Field name mismatch ('avatar'), File too large, or File type rejected."
      );
    }

    try {
      const u = (req as any).user;
      const userId = u?.id || u?.userId;
      const { name, personalEmail, bio } = req.body;

      // 1. Dynamic Update Object (Partial Update)
      let updateData: any = {};

      // Only update if field is sent AND not empty (for strings)
      if (name && name.trim() !== "") updateData.name = name;
      if (personalEmail && personalEmail.trim() !== "")
        updateData.personalEmail = personalEmail;
      // Bio can be empty string if they want to clear it, but usually we just check for undefined
      if (bio !== undefined) updateData.bio = bio;

      // 2. Handle Avatar
      if (req.file) {
        console.log("File detected:", req.file.filename);

        // --- DELETE OLD AVATAR LOGIC ---
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatar: true },
          });

          if (
            currentUser?.avatar &&
            !currentUser.avatar.includes("default") &&
            !currentUser.avatar.includes("placeholder")
          ) {
            // DB Path: /uploads/avatars/...
            // FS Path: backend/uploads/avatars/...
            const relativeDbPath = currentUser.avatar.startsWith("/")
              ? currentUser.avatar.substring(1)
              : currentUser.avatar;

            const oldPath = path.join(__dirname, "../../", relativeDbPath);

            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
              console.log("Deleted old avatar:", oldPath);
            }
          }
        } catch (delErr) {
          console.error("Failed to delete old avatar (non-blocking):", delErr);
        }
        // -------------------------------

        // Path matches: uploads/avatars/{userId}/{filename}
        const subfolder = "avatars";
        const localPath = req.file.path;
        const remotePath = `${subfolder}/${userId}/${req.file.filename}`;

        try {
          const publicUrl = await uploadFileToSupabase(
            localPath,
            "lms",
            remotePath,
            req.file.mimetype
          );
          if (publicUrl) {
            updateData.avatar = publicUrl;
          } else {
            updateData.avatar = `/uploads/${subfolder}/${userId}/${req.file.filename}`;
          }
        } catch (supabaseErr: any) {
          console.error("[UserRouter] Supabase upload failed, falling back to local:", supabaseErr.message);
          updateData.avatar = `/uploads/${subfolder}/${userId}/${req.file.filename}`;
        }
      }

      // 3. Guard: If nothing to update
      if (Object.keys(updateData).length === 0) {
        return res.json({ ok: true, message: "No changes made" });
      }

      // 4. Update Database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          personalEmail: true,
          role: true,
          avatar: true,
          bio: true,
          majority: true,
          studyProgram: true,
        },
      });

      console.log("Update Success for:", updatedUser.name);
      res.json({ ok: true, data: updatedUser });
    } catch (error: any) {
      console.error("Inline Controller Error:", error);
      if (error.code === "P2002") {
        const target = error.meta?.target || [];
        if (target.includes("personalEmail")) {
          return res.status(400).json({ error: "Personal Email is already registered with another account." });
        }
      }
      res
        .status(500)
        .json({ error: "Internal Processing Error", details: error.message });
    }
  }
);

// Ping Route
router.get("/ping", (req, res) => res.send("Pong"));

// GET / - List All Users (Admin/Teacher)
import { getUsers } from "../controllers/userController";
router.get("/", verifyToken, getUsers);

export default router;
