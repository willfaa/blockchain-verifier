import { NextRequest, NextResponse } from "next/server";
import { getSystemSettingsMap } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsMap();
    let layoutConfig = null;
    if (settings["certificate_layout_config"]) {
      try {
        layoutConfig = JSON.parse(settings["certificate_layout_config"]);
      } catch (e) {}
    }

    const payload = {
      certificateLayout: settings["certificate_layout"] || "HORIZONTAL",
      certificatePaperSize: settings["certificate_paper_size"] || "A4",
      paperWidthCm: settings["certificate_paper_width_cm"]
        ? parseFloat(settings["certificate_paper_width_cm"])
        : 29.7,
      paperHeightCm: settings["certificate_paper_height_cm"]
        ? parseFloat(settings["certificate_paper_height_cm"])
        : 21.0,
      instructorName: settings["default_certificate_instructor_name"] || "Budi Headmaster, M.T.",
      instructorNip: settings["default_certificate_instructor_nip"] || "198706152010121002",
      certificateTemplate: settings["default_certificate_template"] || null,
      bgPath: settings["default_certificate_template"] || null,
      layoutConfig: layoutConfig,
    };

    return NextResponse.json({
      ok: true,
      settings: payload,
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: true, data: {}, settings: {} });
  }
}
