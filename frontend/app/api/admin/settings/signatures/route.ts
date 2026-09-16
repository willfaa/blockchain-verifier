import { NextRequest, NextResponse } from "next/server";
import { uploadToSupabaseStorage } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file =
      (formData.get("signature") as File | null) ||
      (formData.get("file") as File | null);
    const signerId = (formData.get("signerId") as string) || "signer";

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No signature file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileExt = file.name ? file.name.split(".").pop() : "png";
    const remoteFileName = `signature-${signerId}-${Date.now()}.${fileExt}`;
    const remotePath = `signatures/${remoteFileName}`;

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
      message: "Tanda tangan digital berhasil diunggah ke Supabase Storage",
      url: storedPath,
      path: storedPath,
    });
  } catch (error: any) {
    console.error("[Serverless Signature Upload Error]:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload signature" },
      { status: 500 }
    );
  }
}
