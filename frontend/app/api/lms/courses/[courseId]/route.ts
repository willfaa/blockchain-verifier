import { NextRequest, NextResponse } from "next/server";
import {
  fetchCourseByIdFromSupabase,
  updateCourseInSupabase,
  deleteCourseInSupabase,
} from "@/lib/supabase";

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await context.params;
  try {
    const body = await request.json();
    const updated = await updateCourseInSupabase(courseId, body);
    return NextResponse.json({
      ok: true,
      message: "Course updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await context.params;
  try {
    await deleteCourseInSupabase(courseId);
    return NextResponse.json({
      ok: true,
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
