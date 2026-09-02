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
  const jwt = process.env.PINATA_JWT?.replace(/^["']|["']$/g, "").trim();
  const apiKey = process.env.PINATA_API_KEY?.replace(/^["']|["']$/g, "").trim();
  const apiSecret = process.env.PINATA_API_SECRET?.replace(/^["']|["']$/g, "").trim();

  let headers: Record<string, string> = {};
  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`;
  } else if (apiKey && apiSecret) {
    headers["pinata_api_key"] = apiKey;
    headers["pinata_secret_api_key"] = apiSecret;
  } else {
    throw new Error("PINATA_JWT or PINATA_API_KEY/PINATA_API_SECRET is missing");
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
      headers,
      timeout: 5000,
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
  const errors: string[] = [];

  // 1. Upload/Pin to Pinata Cloud (Remote Gateway Persistence - Primary)
  if (process.env.PINATA_JWT) {
    try {
      const filename = mfsPath ? mfsPath.split("/").pop() || "certificate.png" : "certificate.png";
      pinataCid = await uploadToPinata(buffer, filename);
      console.log(`[IPFS] Successfully pinned to Pinata (Primary). CID: ${pinataCid}`);
    } catch (err: any) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error("[IPFS] Pinata upload failed:", msg);
      errors.push(`Pinata: ${msg}`);
    }
  }

  // 2. Upload to local Kubo node (Backup)
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

    // Warning if CID mismatch occurs
    if (pinataCid && localCid !== pinataCid) {
      console.warn(`[IPFS] Warning: CID mismatch! Pinata: ${pinataCid}, Local: ${localCid}`);
    }
  } catch (err: any) {
    console.error("[IPFS] Local Kubo node upload failed:", err.message);
    errors.push(`Kubo: ${err.message}`);
  }

  const finalCid = pinataCid || localCid;

  if (!finalCid) {
    throw new Error(`IPFS upload failed: ${errors.join(" | ")}`);
  }

  return finalCid;
}
