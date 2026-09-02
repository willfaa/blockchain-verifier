import { NextRequest, NextResponse } from "next/server";
import { findUserByIdentifier } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await context.params;

  try {
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const { password: _, ...userSafe } = user;
    return NextResponse.json({
      ok: true,
      data: userSafe,
      user: userSafe,
      student: userSafe,
    });
  } catch (error: any) {
    console.error("[Serverless Student Lookup Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to find student" },
      { status: 500 }
    );
  }
}
