import fs from "fs";
import axios from "axios";

/**
 * Uploads a local file to Supabase Storage and returns the public URL.
 * If Supabase configuration is missing, it falls back to empty, allowing local-only.
 * 
 * @param localPath Absolute or relative path to the local file
 * @param bucket Name of the Supabase storage bucket (e.g. "lms")
 * @param remotePath Path inside the bucket (e.g. "avatars/userId/file.png")
 * @param mimeType MIME type of the file
 */
export async function uploadFileToSupabase(
  localPath: string,
  bucket: string,
  remotePath: string,
  mimeType: string = "image/png"
): Promise<string> {
  const apiUrl = process.env.SUPABASE_API_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiUrl || !serviceKey) {
    console.warn("[Supabase] API URL or Service Role Key is missing in env. Falling back to local storage.");
    return "";
  }

  try {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found at ${localPath}`);
    }

    const fileBuffer = fs.readFileSync(localPath);
    // Normalize remote path (Supabase requires forward slashes)
    const cleanedRemotePath = remotePath.replace(/\\/g, "/");
    const uploadUrl = `${apiUrl}/storage/v1/object/${bucket}/${cleanedRemotePath}`;

    console.log(`[Supabase] Uploading to bucket '${bucket}', path '${cleanedRemotePath}'...`);

    // Perform upload via Supabase storage REST API
    await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": mimeType,
        "x-upsert": "true", // Overwrite if file exists
      },
    });

    // Clean up local temp file after successful upload
    try {
      fs.unlinkSync(localPath);
      console.log(`[Supabase] Cleaned up temporary local file: ${localPath}`);
    } catch (unlinkErr) {
      console.warn(`[Supabase] Warning: Could not delete local file ${localPath}:`, unlinkErr);
    }

    // Construct and return the public access URL
    const publicUrl = `${apiUrl}/storage/v1/object/public/${bucket}/${cleanedRemotePath}`;
    console.log(`[Supabase] Upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    const errorDetails = err.response?.data || err.message;
    console.error("[Supabase] Upload failed with details:", errorDetails);
    throw new Error(`Supabase Storage upload failed: ${err.message}`);
  }
}
