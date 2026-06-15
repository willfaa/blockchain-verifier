//backend/src/utils/ipfs.ts
import { create } from "ipfs-http-client";

// Ensure IPFS URL is read from environment or default
// Note: We use HTTP Client to connect to the REMOTE node (Windows Desktop).
// It does NOT spawn a local node.
const IPFS_API_URL = process.env.IPFS_API;

// Create client with explicit HTTP agent (though default is fine)
// We use simple auth-less connection for local dev.
const ipfs = create({ url: IPFS_API_URL });
console.log(`[IPFS] Initialized Client at ${IPFS_API_URL}`);

export async function uploadToIpfs(
  buffer: Buffer,
  mfsPath?: string
): Promise<string> {
  try {
    // 1. Add file to IPFS
    const added = await ipfs.add(buffer);
    const cid = added.cid.toString();

    // 2. (Optional) Copy to MFS for persistence/naming
    if (mfsPath) {
      // Ensure path starts with /
      const targetPath = mfsPath.startsWith("/") ? mfsPath : `/${mfsPath}`;

      // Cleanup previous if exists (optional, simply try/catch)
      try {
        await ipfs.files.rm(targetPath, { recursive: true });
      } catch (e) {
        // ignore missing file
      }

      await ipfs.files.cp(`/ipfs/${cid}`, targetPath, { parents: true });
    }

    return cid;
  } catch (err: any) {
    console.error("IPFS Upload Error:", err);
    throw new Error(`Failed to upload to IPFS: ${err.message}`);
  }
}
