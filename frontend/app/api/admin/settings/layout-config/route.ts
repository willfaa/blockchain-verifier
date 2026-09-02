import { NextRequest, NextResponse } from "next/server";
import {
  getSystemSettingsMap,
  upsertSystemSetting,
  deleteSystemSetting,
} from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const settings = await getSystemSettingsMap();
    const rawConfig = settings["certificate_layout_config"];
    let config = null;
    if (rawConfig) {
      try {
        config = JSON.parse(rawConfig);
      } catch (e) {}
    }
    return NextResponse.json({ ok: true, config });
  } catch (error: any) {
    console.error("[Serverless Layout Config GET Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch layout config" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid config object" },
        { status: 400 }
      );
    }

    const jsonStr = JSON.stringify(config);
    await upsertSystemSetting("certificate_layout_config", jsonStr);

    return NextResponse.json({
      ok: true,
      message: "Layout config saved successfully",
    });
  } catch (error: any) {
    console.error("[Serverless Layout Config POST Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to save layout config" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteSystemSetting("certificate_layout_config");
    return NextResponse.json({
      ok: true,
      message: "Layout config reset to default",
    });
  } catch (error: any) {
    console.error("[Serverless Layout Config DELETE Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to reset layout config" },
      { status: 500 }
    );
  }
}
