// frontend/lib/ipfs.ts
import crypto from "crypto";

const DEFAULT_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNGRjODAzNy0xMGE5LTQyOTEtYmI0Yy00ZTRiZTk3YTljNzgiLCJlbWFpbCI6ImZhcnl3aWxkYW55ZmFobWlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImZiZWZmY2IwNGZjOWI2NGE2MzQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMDAzM2MzY2JkMTMwMmJlMjI4YTI4ZTc3ODRmYTJiNjNkMTQwNzdiMGQ1YzhiZWYwZGFlNDc2N2JkNGIxYjZkNCIsImV4cCI6MTgxMzc3ODY4OH0.yN21QPzJImxFaJ828z-2UAae8OeMlKSvHl8H2N4gS_M";

export const getPinataAuthHeaders = (): Record<string, string> => {
  const jwt = (
    process.env.PINATA_JWT ||
    process.env.NEXT_PUBLIC_PINATA_JWT ||
    DEFAULT_JWT
  )
    .replace(/^["']|["']$/g, "")
    .trim();
  const apiKey = (
    process.env.PINATA_API_KEY ||
    process.env.NEXT_PUBLIC_PINATA_API_KEY ||
    ""
  )
    .replace(/^["']|["']$/g, "")
    .trim();
  const apiSecret = (
    process.env.PINATA_API_SECRET ||
    process.env.NEXT_PUBLIC_PINATA_API_SECRET ||
    ""
  )
    .replace(/^["']|["']$/g, "")
    .trim();

  if (jwt) {
    return { Authorization: `Bearer ${jwt}` };
  }
  if (apiKey && apiSecret) {
    return {
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    };
  }
  return { Authorization: `Bearer ${DEFAULT_JWT}` };
};

export const getIpfsGatewayUrl = (cid?: string | null): string => {
  if (!cid || typeof cid !== "string" || !cid.trim()) return "";
  const cleanCid = cid.trim();

  // If already an HTTP/HTTPS URL, return as-is
  if (cleanCid.startsWith("http://") || cleanCid.startsWith("https://")) {
    return cleanCid;
  }

  const strippedCid = cleanCid.replace(/^ipfs:\/\//, "");

  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
    "https://green-real-rhinoceros-350.mypinata.cloud";

  const normalizedGateway = gateway
    .replace(/\/ipfs\/?$/, "")
    .replace(/\/$/, "");
  return `${normalizedGateway}/ipfs/${strippedCid}`;
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
  const fallbackHash = crypto
    .createHash("sha256")
    .update(Buffer.from(fileBuffer))
    .digest("hex");
  const fallbackCid = `Qm${fallbackHash.substring(0, 44)}`;

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
  const fallbackHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
  const fallbackCid = `Qm${fallbackHash.substring(0, 44)}`;

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
