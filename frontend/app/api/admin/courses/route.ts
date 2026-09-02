import { NextRequest, NextResponse } from "next/server";
import { fetchCoursesFromSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const courses = await fetchCoursesFromSupabase();
    return NextResponse.json({
      ok: true,
      data: courses,
    });
  } catch (error: any) {
    console.error("[Serverless Admin Courses Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
