import { NextRequest, NextResponse } from "next/server";
import { upsertSystemSetting, deleteSystemSetting } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("certificateTemplate") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No template file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    await upsertSystemSetting("default_certificate_template", base64);

    return NextResponse.json({
      ok: true,
      message: "Template background uploaded successfully",
      path: base64,
    });
  } catch (error: any) {
    console.error("[Serverless Template Upload Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteSystemSetting("default_certificate_template");
    return NextResponse.json({
      ok: true,
      message: "Template background removed. Reverted to procedural theme.",
    });
  } catch (error: any) {
    console.error("[Serverless Template DELETE Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to remove template" },
      { status: 500 }
    );
  }
}
