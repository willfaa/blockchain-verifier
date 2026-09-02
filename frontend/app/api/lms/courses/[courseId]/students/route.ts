import { NextRequest, NextResponse } from "next/server";
import { fetchCourseStudentsFromSupabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await context.params;
  try {
    const students = await fetchCourseStudentsFromSupabase(courseId);
    return NextResponse.json({ ok: true, data: students });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch course students" },
      { status: 500 }
    );
  }
}
