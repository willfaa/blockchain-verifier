import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { findUserById, updateUserProfileInSupabase, uploadAvatarToSupabase } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "unesa_blockchain_secret_jwt_key_2026"
      );
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // Parse formData
    const formData = await request.formData();
    const name = formData.get("name")?.toString();
    const bio = formData.get("bio")?.toString();
    const personalEmail = formData.get("personalEmail")?.toString();
    const avatarFile = formData.get("avatar") as File | null;

    const updates: any = {};
    if (name && name.trim() !== "") updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (personalEmail !== undefined) {
      updates.personalEmail = personalEmail.trim() !== "" ? personalEmail.trim() : null;
    }

    // Handle avatar upload if file is present
    if (avatarFile && avatarFile.size > 0) {
      const buffer = await avatarFile.arrayBuffer();
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = avatarFile.name.substring(avatarFile.name.lastIndexOf("."));
      const fileName = `avatar-${uniqueSuffix}${ext}`;
      const avatarUrl = await uploadAvatarToSupabase(
        buffer,
        fileName,
        avatarFile.type || "image/jpeg",
        userId
      );
      if (avatarUrl) {
        updates.avatar = avatarUrl;
      }
    }

    const updated = await updateUserProfileInSupabase(userId, updates);
    if (!updated) {
      const user = await findUserById(userId);
      return NextResponse.json({
        ok: true,
        data: user,
        user,
      });
    }

    const { password: _, ...userSafe } = updated;

    return NextResponse.json({
      ok: true,
      data: userSafe,
      user: userSafe,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("[Serverless Profile Update Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
