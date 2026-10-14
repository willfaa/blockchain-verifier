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

    let transcriptLayoutConfig = null;
    if (settings["transcript_layout_config"]) {
      try {
        transcriptLayoutConfig = JSON.parse(settings["transcript_layout_config"]);
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

    const defaultTranscriptConfig = {
      headerTitle: "KOMPETENSI KEAHLIAN REKAYASA PERANGKAT LUNAK",
      subHeaderTitle: "DAFTAR KOMPETENSI / SUB. KOMPETENSI (TRANSKRIP NILAI SKKNI)",
      footerNote: "Dokumen Digital Sah & Terverifikasi Blockchain Ledger · Standar SKKNI & IDUKA",
      theme: "light",
      showCodeColumn: true,
      showScoreColumn: true,
      showStandardColumn: true,
      signerPlacement: {
        marginTop: 32,
        marginLeft: 0,
        align: "left",
        labelWidth: 190,
      },
      transcriptSigners: [
        {
          id: "ts_1",
          title: "Penguji Internal",
          subTitle: "Internal Assessor",
          name: "TEGUH AGUS SETIAWAN S.Kom",
          identity: "SMKS SENOPATI SEDATI",
        },
        {
          id: "ts_2",
          title: "Penguji Eksternal",
          subTitle: "External Assessor",
          name: "BAMBANG SOERJOHANDOKO",
          identity: "PT SKILL INDOTIMUR AGUNG",
        },
      ],
    };

    let transcriptConfig = null;
    if (settings["default_transcript_config"]) {
      try {
        transcriptConfig = JSON.parse(settings["default_transcript_config"]);
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
      instructorName: legacyName,
      instructorNip: legacyNip,
      instructors: instructors,
      certificateTemplate: settings["default_certificate_template"] || null,
      bgPath: settings["default_certificate_template"] || null,
      transcriptTemplate: settings["default_transcript_template"] || null,
      transcriptBgPath: settings["default_transcript_template"] || null,
      transcriptConfig: transcriptConfig
        ? {
            ...defaultTranscriptConfig,
            ...transcriptConfig,
            showCodeColumn:
              transcriptConfig.showCodeColumn !== undefined
                ? transcriptConfig.showCodeColumn
                : defaultTranscriptConfig.showCodeColumn,
            showScoreColumn:
              transcriptConfig.showScoreColumn !== undefined
                ? transcriptConfig.showScoreColumn
                : defaultTranscriptConfig.showScoreColumn,
            showStandardColumn:
              transcriptConfig.showStandardColumn !== undefined
                ? transcriptConfig.showStandardColumn
                : defaultTranscriptConfig.showStandardColumn,
          }
        : defaultTranscriptConfig,
      layoutConfig: layoutConfig,
      transcriptLayoutConfig: transcriptLayoutConfig,
      schoolName: settings["institution_name"] || settings["default_certificate_school_name"] || "SMK Mitra IDUKA",
      institutionLogo: settings["institution_logo"] || null,
      institutionName: settings["institution_name"] || "UNIVERSITAS NEGERI SURABAYA",
      institutionSubtext: settings["institution_subtext"] || "FAKULTAS TEKNIK - JURUSAN TEKNIK INFORMATIKA",
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

