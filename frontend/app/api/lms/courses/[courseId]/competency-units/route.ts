import { NextRequest, NextResponse } from "next/server";
import {
  fetchCourseUnitsFromSupabase,
  saveCompetencyUnitsInSupabase,
} from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await context.params;
  try {
    const units = await fetchCourseUnitsFromSupabase(courseId);
    return NextResponse.json({ ok: true, data: units });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch competency units" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await context.params;
  try {
    const body = await request.json();
    const units = body.units || (Array.isArray(body) ? body : []);
    const saved = await saveCompetencyUnitsInSupabase(courseId, units);
    return NextResponse.json({
      ok: true,
      message: "Competency units updated successfully",
      data: saved,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to save competency units" },
      { status: 500 }
    );
  }
}
