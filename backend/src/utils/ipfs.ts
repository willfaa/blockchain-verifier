//backend/src/utils/ipfs.ts
import { create } from "ipfs-http-client";
import axios from "axios";

// Ensure IPFS URL is read from environment or default
const IPFS_API_URL = process.env.IPFS_API || "http://127.0.0.1:5001";
const ipfs = create({ url: IPFS_API_URL });
console.log(`[IPFS] Initialized Client at ${IPFS_API_URL}`);

/**
 * Uploads a file buffer directly to Pinata Cloud using their API.
 */
async function uploadToPinata(buffer: Buffer, filename: string): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    throw new Error("PINATA_JWT environment variable is missing");
  }

  // Use standard FormData and Blob (native in Node.js 18+)
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
  formData.append("file", blob, filename);

  // Pinata Custom Metadata & Options
  formData.append("pinataMetadata", JSON.stringify({ name: filename }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 })); // CIDv0 matches local ipfs-http-client

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  return response.data.IpfsHash;
}

/**
 * Dual upload: Uploads the file to the local Kubo node (MFS) and
 * pins it to Pinata Cloud in the background if the PINATA_JWT is present.
 */
export async function uploadToIpfs(
  buffer: Buffer,
  mfsPath?: string
): Promise<string> {
  let localCid = "";
  let pinataCid = "";

  // 1. Upload to local Kubo node
  try {
    const added = await ipfs.add(buffer);
    localCid = added.cid.toString();

    // Copy to MFS if path provided
    if (mfsPath) {
      const targetPath = mfsPath.startsWith("/") ? mfsPath : `/${mfsPath}`;
      try {
        await ipfs.files.rm(targetPath, { recursive: true });
      } catch (e) {
        // ignore missing path
      }
      await ipfs.files.cp(`/ipfs/${localCid}`, targetPath, { parents: true });
    }
    console.log(`[IPFS] Successfully uploaded to local Kubo node. CID: ${localCid}`);
  } catch (err: any) {
    console.error("[IPFS] Local Kubo node upload failed:", err.message);
    throw new Error(`Failed to upload to local IPFS node: ${err.message}`);
  }

  // 2. Upload/Pin to Pinata Cloud (Remote Gateway Persistence)
  if (process.env.PINATA_JWT) {
    try {
      const filename = mfsPath ? mfsPath.split("/").pop() || "certificate.png" : "certificate.png";
      pinataCid = await uploadToPinata(buffer, filename);
      console.log(`[IPFS] Successfully pinned to Pinata. CID: ${pinataCid}`);

      // Warning if CID mismatch occurs
      if (localCid && localCid !== pinataCid) {
        console.warn(`[IPFS] Warning: CID mismatch! Local: ${localCid}, Pinata: ${pinataCid}`);
      }
    } catch (err: any) {
      console.error("[IPFS] Pinata upload failed (using local CID fallback):", err.response?.data || err.message);
      // We do not throw the error here so that development continues even if offline
    }
  }

  // Return local CID, fall back to Pinata CID if local failed (though local error would have thrown above)
  return localCid || pinataCid;
}
