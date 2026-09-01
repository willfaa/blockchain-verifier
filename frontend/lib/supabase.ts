/**
 * Direct Supabase Cloud Helper (Fallback Engine when Laptop/Ngrok is offline)
 * Allows Vercel / Next.js server components and API routes to query Supabase directly 24/7.
 */

const SUPABASE_API_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

const getHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
});

export async function fetchCertificateFromSupabase(id: string) {
  try {
    const cleanId = id.trim();
    // Query certificates by certId or id
    const url = `${SUPABASE_API_URL}/rest/v1/certificates?or=(certId.eq.${cleanId},id.eq.${cleanId})&select=*,course:courses(id,title,certificateTemplate,user:users(id,name,nip,majority,studyProgram))&limit=1`;
    
    const res = await fetch(url, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Supabase Direct] Certificate fetch failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const item = data[0];

    // Fetch course competency units if available
    let competencyUnits = item.competencyUnits;
    if ((!competencyUnits || !Array.isArray(competencyUnits) || competencyUnits.length === 0) && item.courseId) {
      try {
        const unitsUrl = `${SUPABASE_API_URL}/rest/v1/course_competency_units?courseId.eq.${item.courseId}&order=order.asc`;
        const unitsRes = await fetch(unitsUrl, { headers: getHeaders(), cache: "no-store" });
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          if (Array.isArray(unitsData) && unitsData.length > 0) {
            competencyUnits = unitsData.map((u: any) => ({
              code: u.code,
              title: u.title,
              standard: u.standard || "SKKNI",
              result: "KOMPETEN",
            }));
          }
        }
      } catch (e) {}
    }

    return {
      certId: item.certId || item.id,
      studentId: item.studentId,
      name: item.studentName || item.name,
      majority: item.majority,
      program: item.program,
      cid: item.cid || "",
      hash: item.hash,
      status: item.status || "ISSUED",
      issuedAt: item.issuedAt,
      courseId: item.courseId,
      courseName: item.course?.title || undefined,
      course: item.course,
      certificateNumber: item.certificateNumber || undefined,
      schoolName: item.schoolName || undefined,
      signers: item.signers || undefined,
      competencyUnits: competencyUnits || undefined,
      layoutMode: item.layoutMode || "STANDARD",
      blockchainSyncStatus: item.blockchainSyncStatus || "SYNCED",
      blockchainTxId: item.blockchainTxId || undefined,
      source: "mirror_database" as const,
      isChainVerified: item.blockchainSyncStatus === "SYNCED",
    };
  } catch (err: any) {
    console.error("[Supabase Direct Error]:", err.message);
    return null;
  }
}

export async function fetchCoursesFromSupabase() {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/courses?select=*,user:users(id,name)&order=createdAt.desc`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    console.error("[Supabase Direct Courses Error]:", err.message);
    return [];
  }
}
