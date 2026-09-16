import { NextRequest, NextResponse } from "next/server";
import { upsertSystemSetting, deleteSystemSetting, uploadToSupabaseStorage } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file =
      (formData.get("transcriptTemplate") as File | null) ||
      (formData.get("file") as File | null);

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No transcript template file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileExt = file.name ? file.name.split(".").pop() : "png";
    const remoteFileName = `transcript-bg-${Date.now()}.${fileExt}`;
    const remotePath = `templates/${remoteFileName}`;

    // Upload directly to Supabase Storage bucket ('lms')
    let storedPath = await uploadToSupabaseStorage(
      bytes,
      remotePath,
      file.type || "image/png",
      "lms"
    );

    // Fallback to Base64 only if cloud storage upload failed
    if (!storedPath) {
      const buffer = Buffer.from(bytes);
      storedPath = `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`;
    }

    await upsertSystemSetting("default_transcript_template", storedPath);

    return NextResponse.json({
      ok: true,
      message: "Transcript template background uploaded successfully to Supabase Storage",
      path: storedPath,
    });
  } catch (error: any) {
    console.error("[Serverless Transcript Template Upload Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload transcript template" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteSystemSetting("default_transcript_template");
    return NextResponse.json({
      ok: true,
      message: "Transcript template background removed.",
    });
  } catch (error: any) {
    console.error("[Serverless Transcript Template DELETE Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to remove transcript template" },
      { status: 500 }
    );
  }
}
