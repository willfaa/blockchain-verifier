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
    const url = `${SUPABASE_API_URL}/rest/v1/bidang_keahlian?select=*,programKeahlian:program_keahlian(*,konsentrasiKeahlian:konsentrasi_keahlian(*))&order=name.asc`;
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

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      data: Array.isArray(data) ? data : [],
    });
  } catch (error: any) {
    console.error("[Serverless Departments Error]:", error);
    return NextResponse.json({ ok: true, data: [] });
  }
}
