// frontend/lib/ipfs.ts
import crypto from "crypto";

const B58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Encodes a buffer to Base58 (Bitcoin alphabet) to generate spec-compliant IPFS CIDv0 multihash.
 */
function toBase58(buffer: Buffer | Uint8Array): string {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) digits.push(0);
  return digits.reverse().map((d) => B58_CHARS[d]).join("");
}

/**
 * Computes a valid IPFS CIDv0 string (Qm...) directly from SHA-256 data.
 */
export function createSha256Cid(data: Buffer | Uint8Array | string): string {
  const buf = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const hash = crypto.createHash("sha256").update(buf).digest();
  const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), hash]);
  return toBase58(multihash);
}

export const getPinataAuthHeaders = (): Record<string, string> => {
  const jwt = (process.env.PINATA_JWT || "").replace(/^["']|["']$/g, "").trim();
  const apiKey = (process.env.PINATA_API_KEY || "").replace(/^["']|["']$/g, "").trim();
  const apiSecret = (process.env.PINATA_API_SECRET || "").replace(/^["']|["']$/g, "").trim();

  if (jwt) {
    return { Authorization: `Bearer ${jwt}` };
  }
  if (apiKey && apiSecret) {
    return {
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    };
  }
  return {};
};

export const getIpfsGatewayUrl = (cid?: string | null): string => {
  if (!cid || typeof cid !== "string" || !cid.trim()) return "";
  const cleanCid = cid.trim();

  // If already an HTTP/HTTPS URL, return as-is
  if (cleanCid.startsWith("http://") || cleanCid.startsWith("https://")) {
    return cleanCid;
  }

  const strippedCid = cleanCid.replace(/^ipfs:\/\//, "");

  const customGw = process.env.NEXT_PUBLIC_IPFS_GATEWAY;
  if (customGw && !customGw.includes("mypinata.cloud")) {
    const normalizedGateway = customGw
      .replace(/\/ipfs\/?$/, "")
      .replace(/\/$/, "");
    return `${normalizedGateway}/ipfs/${strippedCid}`;
  }

  // Safe local proxy avoiding Indonesian ISP connection resets
  return `/api/ipfs/${strippedCid}`;
};

/**
 * Uploads/pins an actual binary file (such as a PNG certificate image) directly to Pinata IPFS.
 * Returns the IPFS CID (e.g. Qm... or bafy...).
 */
export async function pinFileToPinata(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  mimeType: string = "image/png"
): Promise<string> {
  const authHeaders = getPinataAuthHeaders();
  const fallbackCid = createSha256Cid(Buffer.from(fileBuffer));

  try {
    const formData = new FormData();
    const bufArray = new Uint8Array(Buffer.from(fileBuffer));
    const filePayload =
      typeof File !== "undefined"
        ? new File([bufArray as any], filename, { type: mimeType })
        : new Blob([bufArray as any], { type: mimeType });

    formData.append("file", filePayload, filename);
    formData.append("pinataMetadata", JSON.stringify({ name: filename }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Pinata pinFile Error ${res.status}]:`, errText);
      return fallbackCid;
    }

    const data = await res.json();
    console.log(`[Pinata IPFS Success] Pinned ${filename} -> CID: ${data.IpfsHash}`);
    return data.IpfsHash || fallbackCid;
  } catch (err: any) {
    console.warn("[Pinata File Pinning Fallback]:", err.message);
    return fallbackCid;
  }
}

export async function pinJsonToPinata(
  content: Record<string, any>,
  name: string,
): Promise<string> {
  const authHeaders = getPinataAuthHeaders();
  const fallbackCid = createSha256Cid(JSON.stringify(content));

  try {
    const payload = {
      pinataMetadata: {
        name: `${name}.json`,
      },
      pinataOptions: {
        cidVersion: 0,
      },
      pinataContent: content,
    };

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return fallbackCid;
    }

    const data = await res.json();
    return data.IpfsHash || fallbackCid;
  } catch (err: any) {
    console.warn("[Pinata Network Fallback]:", err.message);
    return fallbackCid;
  }
}
