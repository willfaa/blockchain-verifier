import { NextRequest, NextResponse } from "next/server";
import { fetchCertificateFromSupabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const cert = await fetchCertificateFromSupabase(id);

    if (!cert) {
      return NextResponse.json(
        { ok: false, error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: cert,
      record: cert,
      source: "mirror_database",
    });
  } catch (error: any) {
    console.error("[API Certificate Fallback Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to retrieve certificate" },
      { status: 500 }
    );
  }
}
