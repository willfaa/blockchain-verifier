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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiNGRjODAzNy0xMGE5LTQyOTEtYmI0Yy00ZTRiZTk3YTljNzgiLCJlbWFpbCI6ImZhcnl3aWxkYW55ZmFobWlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImZiZWZmY2IwNGZjOWI2NGE2MzQyIiwic2NvcGVkS2V5U2VjcmV0IjoiMDAzM2MzY2JkMTMwMmJlMjI4YTI4ZTc3ODRmYTJiNjNkMTQwNzdiMGQ1YzhiZWYwZGFlNDc2N2JkNGIxYjZkNCIsImV4cCI6MTgxMzc3ODY4OH0.yN21QPzJImxFaJ828z-2UAae8OeMlKSvHl8H2N4gS_M";

export async function GET(request: NextRequest) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  let isDbOnline = false;
  let isIpfsOnline = false;
  let totalUsers = 0;
  let pendingTeachers = 0;
  let totalCourses = 0;
  let totalCertificates = 0;
  let recentActivity: any[] = [];

  // 1. Direct Check Supabase Cloud Database
  try {
    const [usersRes, teachersRes, coursesRes, certsRes] = await Promise.allSettled([
      fetch(`${SUPABASE_API_URL}/rest/v1/users?select=id`, { headers, cache: "no-store" }),
      fetch(`${SUPABASE_API_URL}/rest/v1/users?role=eq.teacher&isVerified=eq.false&select=id`, { headers, cache: "no-store" }),
      fetch(`${SUPABASE_API_URL}/rest/v1/courses?select=id`, { headers, cache: "no-store" }),
      fetch(`${SUPABASE_API_URL}/rest/v1/certificates?select=id,studentName,hash,issuedAt,program&order=issuedAt.desc&limit=5`, { headers, cache: "no-store" }),
    ]);

    if (usersRes.status === "fulfilled" && usersRes.value.ok) {
      isDbOnline = true;
      const data = await usersRes.value.json();
      totalUsers = Array.isArray(data) ? data.length : 0;
    }
    if (teachersRes.status === "fulfilled" && teachersRes.value.ok) {
      const data = await teachersRes.value.json();
      pendingTeachers = Array.isArray(data) ? data.length : 0;
    }
    if (coursesRes.status === "fulfilled" && coursesRes.value.ok) {
      const data = await coursesRes.value.json();
      totalCourses = Array.isArray(data) ? data.length : 0;
    }
    if (certsRes.status === "fulfilled" && certsRes.value.ok) {
      const data = await certsRes.value.json();
      recentActivity = Array.isArray(data) ? data : [];
      totalCertificates = recentActivity.length;
    }
  } catch (e: any) {
    console.warn("[Cloud Stats Fallback] Supabase check failed:", e.message);
  }

  // 2. Direct Check Pinata IPFS Cloud
  try {
    const cleanJwt = PINATA_JWT.replace(/^["']|["']$/g, "").trim();
    const pinataRes = await fetch("https://api.pinata.cloud/data/testAuthentication", {
      headers: { Authorization: `Bearer ${cleanJwt}` },
      cache: "no-store",
    });
    if (pinataRes.ok) {
      isIpfsOnline = true;
    }
  } catch (e: any) {
    console.warn("[Cloud Stats Fallback] Pinata check failed:", e.message);
  }

  return NextResponse.json({
    ok: true,
    stats: {
      totalUsers,
      pendingTeachers,
      totalCertificates,
      totalCourses,
    },
    system: {
      dbPort: "5432 (Cloud Pooler)",
      ipfsApi: "https://api.pinata.cloud",
      ipfsGateway: "https://gateway.pinata.cloud",
      fabricEnabled: false,
      uptime: 86400,
      mode: "CLOUD_DIRECT_RESILIENCE",
      health: {
        database: isDbOnline ? "ONLINE" : "OFFLINE",
        ipfs: isIpfsOnline ? "ONLINE" : "OFFLINE",
        blockchain: "MIRROR_CLOUD",
        backend: "ONLINE",
        frontend: "ONLINE",
      },
    },
    recentActivity,
  });
}
