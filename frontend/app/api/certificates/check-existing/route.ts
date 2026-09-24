import { NextRequest, NextResponse } from "next/server";

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

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = (searchParams.get("studentId") || "").trim();
    const name = (searchParams.get("name") || "").trim();
    const courseId = (searchParams.get("courseId") || "").trim();
    const userId = (searchParams.get("userId") || "").trim();

    // If only courseId is provided (e.g. for batch view), fetch all certificates in this course
    if (!studentId && !name && !userId) {
      if (!courseId) {
        return NextResponse.json({ ok: true, hasExisting: false, existingCert: null, count: 0 });
      }

      const cleanCourseId = encodeURIComponent(courseId);
      const url = `${SUPABASE_API_URL}/rest/v1/certificates?courseId=eq.${cleanCourseId}&status=in.(ISSUED,PENDING)&order=issuedAt.desc&limit=200`;
      const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json({ ok: true, hasExisting: false, existingCert: null, count: 0 });
      }

      const certs = await res.json();
      if (!Array.isArray(certs) || certs.length === 0) {
        return NextResponse.json({ ok: true, hasExisting: false, existingCert: null, count: 0, byStudentId: {}, byUserId: {} });
      }

      const byStudentId: Record<string, any> = {};
      const byUserId: Record<string, any> = {};
      certs.forEach((c: any) => {
        if (c.studentId) byStudentId[c.studentId] = c;
        if (c.userId) byUserId[c.userId] = c;
      });

      return NextResponse.json({
        ok: true,
        hasExisting: certs.length > 0,
        count: certs.length,
        allExisting: certs,
        byStudentId,
        byUserId,
      });
    }

    // Specific student lookup
    const filters: string[] = [];
    if (studentId) {
      const cleanStdId = encodeURIComponent(studentId);
      filters.push(`studentId.eq.${cleanStdId}`);
    }
    if (userId) {
      const cleanUserId = encodeURIComponent(userId);
      filters.push(`userId.eq.${cleanUserId}`);
    }

    let url = "";
    if (filters.length > 0) {
      url = `${SUPABASE_API_URL}/rest/v1/certificates?or=(${filters.join(",")})&status=in.(ISSUED,PENDING)&order=issuedAt.desc&limit=10`;
    } else if (name) {
      const cleanName = encodeURIComponent(name);
      url = `${SUPABASE_API_URL}/rest/v1/certificates?studentName=ilike.*${cleanName}*&status=in.(ISSUED,PENDING)&order=issuedAt.desc&limit=10`;
    }

    if (!url) {
      return NextResponse.json({ ok: true, hasExisting: false, existingCert: null });
    }

    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ ok: true, hasExisting: false, existingCert: null });
    }

    const certs = await res.json();
    if (!Array.isArray(certs) || certs.length === 0) {
      return NextResponse.json({ ok: true, hasExisting: false, existingCert: null, count: 0 });
    }

    let matchingCert = certs[0];
    if (courseId) {
      const courseMatch = certs.find((c: any) => c.courseId === courseId);
      if (courseMatch) matchingCert = courseMatch;
    }

    return NextResponse.json({
      ok: true,
      hasExisting: true,
      existingCert: matchingCert,
      count: certs.length,
      allExisting: certs,
    });
  } catch (err: any) {
    console.error("[Check Existing Certificate Error]:", err.message);
    return NextResponse.json({ ok: true, hasExisting: false, existingCert: null });
  }
}
