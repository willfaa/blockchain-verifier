import { NextRequest, NextResponse } from "next/server";
import { fetchCourseByIdFromSupabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await context.params;
  try {
    const course = await fetchCourseByIdFromSupabase(courseId);
    if (!course) {
      return NextResponse.json(
        { ok: false, error: "Course not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: course });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch course" },
      { status: 500 }
    );
  }
}
