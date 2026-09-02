import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseUser } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    if (payload.nim && !payload.studentId) payload.studentId = payload.nim;
    if (payload.nisn && !payload.studentId) payload.studentId = payload.nisn;

    if (!payload.email || !payload.password || !payload.name) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const userRecord = {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      personalEmail: payload.personalEmail || null,
      password: hashedPassword,
      role: payload.role || "student",
      studentId: payload.studentId || null,
      nip: payload.nip || null,
      faculty: payload.faculty || null,
      majority: payload.majority || null,
      studyProgram: payload.studyProgram || null,
      isVerified: false,
      isApproved: false,
      isActive: true,
    };

    const user = await createSupabaseUser(userRecord);
    const { password: _, ...userSafe } = user;

    return NextResponse.json({
      ok: true,
      user: userSafe,
      message: "Registration Successful! Please wait for Admin approval.",
    });
  } catch (error: any) {
    console.error("[Serverless Register Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
