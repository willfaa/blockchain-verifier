import { NextRequest, NextResponse } from "next/server";
import { fetchCertificatesFromSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const certs = await fetchCertificatesFromSupabase(200);
    return NextResponse.json({
      ok: true,
      data: certs,
      total: certs.length,
    });
  } catch (error: any) {
    console.error("[API Admin Certificates Fetch Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}
