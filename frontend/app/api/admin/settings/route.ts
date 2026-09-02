import { NextRequest, NextResponse } from "next/server";
import { getSystemSettingsMap, upsertSystemSetting } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsMap();
    return NextResponse.json({
      ok: true,
      settings: {
        certificateLayout: settings["certificate_layout"] || "HORIZONTAL",
        certificatePaperSize: settings["certificate_paper_size"] || "A4",
        paperWidthCm: settings["certificate_paper_width_cm"]
          ? parseFloat(settings["certificate_paper_width_cm"])
          : 29.7,
        paperHeightCm: settings["certificate_paper_height_cm"]
          ? parseFloat(settings["certificate_paper_height_cm"])
          : 21.0,
      },
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
    console.error("[Serverless Settings GET Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      certificateLayout,
      certificatePaperSize,
      paperWidthCm,
      paperHeightCm,
      instructorName,
      instructorNip,
    } = body;

    if (certificateLayout) {
      await upsertSystemSetting("certificate_layout", certificateLayout);
    }
    if (certificatePaperSize) {
      await upsertSystemSetting("certificate_paper_size", certificatePaperSize);
    }
    if (paperWidthCm !== undefined) {
      await upsertSystemSetting("certificate_paper_width_cm", String(paperWidthCm));
    }
    if (paperHeightCm !== undefined) {
      await upsertSystemSetting("certificate_paper_height_cm", String(paperHeightCm));
    }
    if (instructorName !== undefined) {
      await upsertSystemSetting("default_certificate_instructor_name", instructorName);
    }
    if (instructorNip !== undefined) {
      await upsertSystemSetting("default_certificate_instructor_nip", instructorNip);
    }

    return NextResponse.json({
      ok: true,
      message: "Settings updated successfully",
      settings: {
        certificateLayout: certificateLayout || "HORIZONTAL",
        certificatePaperSize: certificatePaperSize || "A4",
        paperWidthCm: paperWidthCm ? parseFloat(paperWidthCm) : 29.7,
        paperHeightCm: paperHeightCm ? parseFloat(paperHeightCm) : 21.0,
      },
    });
  } catch (error: any) {
    console.error("[Serverless Settings POST Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
