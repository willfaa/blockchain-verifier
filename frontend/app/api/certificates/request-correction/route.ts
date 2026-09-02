import { NextRequest, NextResponse } from "next/server";
import { insertCorrectionRequestInSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = await insertCorrectionRequestInSupabase(body);
    return NextResponse.json({
      ok: true,
      message: "Correction request submitted successfully",
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}
