import { NextRequest, NextResponse } from "next/server";
import { getSystemSettingsMap, upsertSystemSetting } from "@/lib/supabase";

export interface InstructorSetting {
  id: string;
  name: string;
  title: string;
  nip: string;
  signatureUrl?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsMap();
    const legacyName =
      settings["default_certificate_instructor_name"] ||
      "Drs. H. Mulyono, M.Pd.";
    const legacyNip =
      settings["default_certificate_instructor_nip"] || "197204121998021003";

    let instructors: InstructorSetting[] = [];
    const rawJson = settings["default_certificate_instructors_json"];
    if (rawJson) {
      try {
        instructors = JSON.parse(rawJson);
      } catch (e) {
        instructors = [];
      }
    }

    if (!instructors || instructors.length === 0) {
      instructors = [
        {
          id: "signer1",
          name: legacyName,
          title: "KEPALA SEKOLAH / PENGUJI INTERNAL",
          nip: legacyNip,
          signatureUrl: null,
        },
        {
          id: "signer2",
          name: "Ir. Hendra Kusuma, M.Kom.",
          title: "ASESOR MITRA INDUSTRI (DUDI)",
          nip: "PT. TELKOM INDONESIA TBK",
          signatureUrl: null,
        },
      ];
    }

    return NextResponse.json({
      ok: true,
      data: {
        instructorName: legacyName,
        instructorNip: legacyNip,
        instructors,
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
    const { instructorName, instructorNip, instructors } = body;

    if (Array.isArray(instructors)) {
      await upsertSystemSetting(
        "default_certificate_instructors_json",
        JSON.stringify(instructors)
      );
      if (instructors.length > 0 && instructors[0].name) {
        await upsertSystemSetting(
          "default_certificate_instructor_name",
          instructors[0].name
        );
      }
      if (instructors.length > 0 && instructors[0].nip) {
        await upsertSystemSetting(
          "default_certificate_instructor_nip",
          instructors[0].nip
        );
      }
    } else {
      if (instructorName !== undefined) {
        await upsertSystemSetting("default_certificate_instructor_name", instructorName);
      }
      if (instructorNip !== undefined) {
        await upsertSystemSetting("default_certificate_instructor_nip", instructorNip);
      }
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
