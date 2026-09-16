import { NextRequest, NextResponse } from "next/server";
import { uploadToSupabaseStorage } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file =
      (formData.get("image") as File | null) ||
      (formData.get("file") as File | null);

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileExt = file.name ? file.name.split(".").pop() : "png";
    const remoteFileName = `custom-layer-${Date.now()}.${fileExt}`;
    const remotePath = `layers/${remoteFileName}`;

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

    return NextResponse.json({
      ok: true,
      message: "Gambar layer berhasil diunggah ke Supabase Storage",
      url: storedPath,
      path: storedPath,
    });
  } catch (error: any) {
    console.error("[Serverless Custom Layer Upload Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload image layer" },
      { status: 500 }
    );
  }
}
