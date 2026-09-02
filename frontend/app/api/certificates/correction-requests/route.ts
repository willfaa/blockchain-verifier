import { NextRequest, NextResponse } from "next/server";
import {
  fetchCorrectionRequestsFromSupabase,
  insertCorrectionRequestInSupabase,
} from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const requests = await fetchCorrectionRequestsFromSupabase(status);
    return NextResponse.json({ ok: true, data: requests });
  } catch (error: any) {
    return NextResponse.json({ ok: true, data: [] });
  }
}

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
