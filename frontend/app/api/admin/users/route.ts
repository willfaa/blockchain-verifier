import { NextRequest, NextResponse } from "next/server";

const SUPABASE_API_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    let url = `${SUPABASE_API_URL}/rest/v1/users?select=*&order=createdAt.desc`;
    if (role) {
      url += `&role=eq.${encodeURIComponent(role)}`;
    }

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, data: [] });
    }

    let users = await res.json();
    if (search && Array.isArray(users)) {
      const q = search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.studentId?.toLowerCase().includes(q) ||
          u.nip?.toLowerCase().includes(q)
      );
    }

    // Strip password hashes
    const safeUsers = Array.isArray(users)
      ? users.map(({ password, ...u }: any) => u)
      : [];

    return NextResponse.json({
      ok: true,
      data: safeUsers,
      total: safeUsers.length,
    });
  } catch (error: any) {
    console.error("[Serverless Admin Users Error]:", error);
    return NextResponse.json({ ok: true, data: [], total: 0 });
  }
}
