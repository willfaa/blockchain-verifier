import { NextRequest, NextResponse } from "next/server";
import { upsertSystemSetting, deleteSystemSetting, uploadToSupabaseStorage } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file =
      (formData.get("institutionLogo") as File | null) ||
      (formData.get("logo") as File | null) ||
      (formData.get("file") as File | null);

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No logo file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileExt = file.name ? file.name.split(".").pop() : "png";
    const remoteFileName = `institution-logo-${Date.now()}.${fileExt}`;
    const remotePath = `logos/${remoteFileName}`;

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

    await upsertSystemSetting("institution_logo", storedPath);

    return NextResponse.json({
      ok: true,
      message: "Logo lembaga berhasil diunggah ke Supabase Storage",
      url: storedPath,
      path: storedPath,
    });
  } catch (error: any) {
    console.error("[Serverless Logo Upload Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload logo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteSystemSetting("institution_logo");
    return NextResponse.json({
      ok: true,
      message: "Logo lembaga berhasil dihapus. Kembali ke logo default.",
    });
  } catch (error: any) {
    console.error("[Serverless Logo DELETE Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to delete logo" },
      { status: 500 }
    );
  }
}
