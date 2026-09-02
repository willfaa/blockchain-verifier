import { NextRequest, NextResponse } from "next/server";
import { fetchCoursesFromSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const courses = await fetchCoursesFromSupabase();
    return NextResponse.json({
      ok: true,
      data: courses,
      source: "mirror_database",
    });
  } catch (error: any) {
    console.error("[API Courses Fallback Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
