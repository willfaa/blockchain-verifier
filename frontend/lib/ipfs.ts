// frontend/lib/ipfs.ts

const PINATA_JWT =
  process.env.PINATA_JWT ||
  process.env.NEXT_PUBLIC_PINATA_JWT ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNGRjODAzNy0xMGE5LTQyOTEtYmI0Yy00ZTRiZTk3YTljNzgiLCJlbWFpbCI6ImZhcnl3aWxkYW55ZmFobWlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImZiZWZmY2IwNGZjOWI2NGE2MzQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMDAzM2MzY2JkMTMwMmJlMjI4YTI4ZTc3ODRmYTJiNjNkMTQwNzdiMGQ1YzhiZWYwZGFlNDc2N2JkNGIxYjZkNCIsImV4cCI6MTgxMzc3ODY4OH0.yN21QPzJImxFaJ828z-2UAae8OeMlKSvHl8H2N4gS_M";

export const getIpfsGatewayUrl = (cid?: string | null): string => {
  if (!cid || typeof cid !== "string" || !cid.trim()) return "";
  const cleanCid = cid.trim().replace(/^ipfs:\/\//, "");
  
  const gateway =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ||
    "https://gateway.pinata.cloud/ipfs";

  const normalizedGateway = gateway.replace(/\/ipfs\/?$/, "").replace(/\/$/, "");
  return `${normalizedGateway}/ipfs/${cleanCid}`;
};

export async function pinJsonToPinata(
  content: Record<string, any>,
  name: string
): Promise<string> {
  const cleanJwt = PINATA_JWT.replace(/^["']|["']$/g, "").trim();

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
        Authorization: `Bearer ${cleanJwt}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("[Pinata Pin Error]:", res.status, errText);
      return "";
    }

    const data = await res.json();
    return data.IpfsHash || "";
  } catch (err: any) {
    console.warn("[Pinata Network Error]:", err.message);
    return "";
  }
}
