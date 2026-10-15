import { NextRequest, NextResponse } from "next/server";

const SUPABASE_API_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

const PINATA_JWT =
  process.env.PINATA_JWT ||
  process.env.NEXT_PUBLIC_PINATA_JWT ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNGRjODAzNy0xMGE5LTQyOTEtYmI0Yy00ZTRiZTk3YTljNzgiLCJlbWFpbCI6ImZhcnl3aWxkYW55ZmFobWlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImZiZWZmY2IwNGZjOWI2NGE2MzQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMDAzM2MzY2JkMTMwMmJlMjI4YTI4ZTc3ODRmYTJiNjNkMTQwNzdiMGQ1YzhiZWYwZGFlNDc2N2JkNGIxYjZkNCIsImV4cCI6MTgxMzc3ODY4OH0.yN21QPzJImxFaJ828z-2UAae8OeMlKSvHl8H2N4gS_M";

const PUBLIC_GATEWAYS = [
  "https://dweb.link/ipfs",
  "https://w3s.link/ipfs",
  "https://green-real-rhinoceros-350.mypinata.cloud/ipfs",
  "https://gateway.pinata.cloud/ipfs",
  "https://cloudflare-ipfs.com/ipfs",
  "https://ipfs.io/ipfs",
];

interface RouteParams {
  params: Promise<{ cid: string }>;
}

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const { cid: rawCid } = await context.params;
    if (!rawCid) {
      return NextResponse.json({ error: "Missing IPFS CID parameter" }, { status: 400 });
    }

    const cleanCid = rawCid.trim().replace(/^ipfs:\/\//, "");

    // 1. FAST MIRROR A: Lookup by primary CID in Supabase Database
    try {
      const dbUrl = `${SUPABASE_API_URL}/rest/v1/certificates?cid=eq.${cleanCid}&select=certId,cid&limit=1`;
      const dbRes = await fetch(dbUrl, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      });

      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const certId = rows[0].certId;
          for (const ext of ["jpg", "png"]) {
            const candUrl = `${SUPABASE_API_URL}/storage/v1/object/public/lms/certificates/${certId}_front.${ext}`;
            const imgRes = await fetch(candUrl, {
              cache: "force-cache",
              signal: AbortSignal.timeout(3000),
            });
            if (imgRes.ok && imgRes.status === 200) {
              const contentType = imgRes.headers.get("content-type") || `image/${ext === "png" ? "png" : "jpeg"}`;
              const arrayBuf = await imgRes.arrayBuffer();
              return new NextResponse(arrayBuf, {
                status: 200,
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=31536000, immutable",
                  "X-IPFS-CID": cleanCid,
                  "X-Artifact-Source": "Supabase-CDN-Primary",
                  "Access-Control-Allow-Origin": "*",
                },
              });
            }
          }
        }
      }
    } catch (dbErr: any) {
      console.warn("[IPFS Proxy] Supabase primary lookup note:", dbErr?.message);
    }

    // 2. FAST MIRROR B: Lookup filename metadata via Pinata API (Unblocked) -> Supabase Storage
    try {
      const pinRes = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${cleanCid}&status=pinned&pageLimit=1`, {
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        signal: AbortSignal.timeout(3500),
      });

      if (pinRes.ok) {
        const pinData = await pinRes.json();
        if (pinData.rows && pinData.rows.length > 0) {
          const rawName = pinData.rows[0].metadata?.name;
          if (rawName) {
            const cleanName = rawName.replace(/^\/certs\//, "").replace(/^certificates\//, "");
            const candUrl = `${SUPABASE_API_URL}/storage/v1/object/public/lms/certificates/${cleanName}`;
            const imgRes = await fetch(candUrl, {
              cache: "force-cache",
              signal: AbortSignal.timeout(3000),
            });
            if (imgRes.ok && imgRes.status === 200) {
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              const arrayBuf = await imgRes.arrayBuffer();
              return new NextResponse(arrayBuf, {
                status: 200,
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=31536000, immutable",
                  "X-IPFS-CID": cleanCid,
                  "X-Artifact-Source": "Pinata-Metadata-Supabase",
                  "Access-Control-Allow-Origin": "*",
                },
              });
            }
          }
        }
      }
    } catch (pinErr: any) {
      console.warn("[IPFS Proxy] Pinata metadata lookup note:", pinErr?.message);
    }

    // 3. REMOTE FALLBACK: Server-side fetch from Public IPFS Gateways (e.g. When deployed on Vercel/VPS)
    for (const gw of PUBLIC_GATEWAYS) {
      const gwUrl = `${gw}/${cleanCid}`;
      try {
        const gwRes = await fetch(gwUrl, {
          signal: AbortSignal.timeout(4000),
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        if (gwRes.ok && gwRes.status === 200) {
          const contentType = gwRes.headers.get("content-type") || "image/jpeg";
          const arrayBuf = await gwRes.arrayBuffer();
          return new NextResponse(arrayBuf, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-IPFS-CID": cleanCid,
              "X-Artifact-Source": gw,
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (e) {
        // Continue to next gateway
      }
    }

    return NextResponse.json(
      {
        error: "IPFS artifact could not be reached via public gateways.",
        cid: cleanCid,
        tip: "Periksa koneksi jaringan atau DNS Anda (gunakan Cloudflare WARP / 1.1.1.1) jika mengakses gateway publik langsung.",
      },
      { status: 504 }
    );
  } catch (error: any) {
    console.error("[IPFS Proxy Route Error]:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving IPFS artifact", details: error?.message },
      { status: 500 }
    );
  }
}
