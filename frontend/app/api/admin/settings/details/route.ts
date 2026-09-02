import { NextRequest, NextResponse } from "next/server";
import { getSystemSettingsMap, upsertSystemSetting } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsMap();
    return NextResponse.json({
      ok: true,
      data: {
        instructorName:
          settings["default_certificate_instructor_name"] ||
          "Dr. Budi Santoso, M.T.",
        instructorNip:
          settings["default_certificate_instructor_nip"] || "198706152010121002",
        certificateTemplate: settings["default_certificate_template"] || null,
      },
    });
  } catch (error: any) {
    console.error("[Serverless Settings Details GET Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch details" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instructorName, instructorNip } = body;

    if (instructorName !== undefined) {
      await upsertSystemSetting("default_certificate_instructor_name", instructorName);
    }
    if (instructorNip !== undefined) {
      await upsertSystemSetting("default_certificate_instructor_nip", instructorNip);
    }

    return NextResponse.json({
      ok: true,
      message: "Certificate details updated successfully",
    });
  } catch (error: any) {
    console.error("[Serverless Settings Details POST Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to update details" },
      { status: 500 }
    );
  }
}
