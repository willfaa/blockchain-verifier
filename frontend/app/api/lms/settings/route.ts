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

    let instructors = [];
    if (settings["default_certificate_instructors_json"]) {
      try {
        instructors = JSON.parse(settings["default_certificate_instructors_json"]);
      } catch (e) {}
    }

    const legacyName = settings["default_certificate_instructor_name"] || "Budi Headmaster, M.T.";
    const legacyNip = settings["default_certificate_instructor_nip"] || "198706152010121002";

    if (!instructors || instructors.length === 0) {
      instructors = [
        {
          id: "signer1",
          name: legacyName,
          title: "KEPALA SEKOLAH / PENGUJI INTERNAL",
          nip: legacyNip,
          signatureUrl: null,
        },
      ];
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
      instructorName: legacyName,
      instructorNip: legacyNip,
      instructors: instructors,
      certificateTemplate: settings["default_certificate_template"] || null,
      bgPath: settings["default_certificate_template"] || null,
      layoutConfig: layoutConfig,
      schoolName: settings["default_certificate_school_name"] || "SMK Mitra IDUKA",
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

