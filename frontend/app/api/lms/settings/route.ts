import { NextRequest, NextResponse } from "next/server";
import { getSystemSettingsMap } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsMap();
    return NextResponse.json({
      ok: true,
      data: {
        certificateLayout: settings["certificate_layout"] || "HORIZONTAL",
        certificatePaperSize: settings["certificate_paper_size"] || "A4",
        paperWidthCm: settings["certificate_paper_width_cm"]
          ? parseFloat(settings["certificate_paper_width_cm"])
          : 29.7,
        paperHeightCm: settings["certificate_paper_height_cm"]
          ? parseFloat(settings["certificate_paper_height_cm"])
          : 21.0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: true, data: {} });
  }
}
